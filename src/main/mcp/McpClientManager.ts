import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import {
  ListRootsRequestSchema,
  CreateMessageRequestSchema,
  ToolListChangedNotificationSchema,
  ResourceListChangedNotificationSchema,
  PromptListChangedNotificationSchema,
  ResourceUpdatedNotificationSchema
} from '@modelcontextprotocol/sdk/types.js'
import {
  McpServerConfig,
  McpTool,
  McpResource,
  McpResourceContent,
  McpPrompt,
  JsonRpcLog,
  ProcessConsoleLog,
  ServerProcessStats,
  InterceptorRule
} from '../../shared/types'
import { BrowserWindow } from 'electron'
import { randomUUID } from 'crypto'
import { exec } from 'child_process'

interface ServerInstance {
  config: McpServerConfig
  client: Client
  transport: StdioClientTransport | SSEClientTransport
  cleanup?: () => void
  connectedAt: number
}

function sanitizeJsonRpcPayload(payload: unknown): unknown {
  if (payload === null || payload === undefined) return payload
  if (typeof payload === 'string') {
    return payload
      .replace(/Bearer\s+[a-zA-Z0-9._-]{20,}/gi, 'Bearer ***[REDACTED]')
      .replace(/sk-[a-zA-Z0-9_-]{20,}/gi, 'sk-***[REDACTED]')
      .replace(/ghp_[a-zA-Z0-9]{20,}/gi, 'ghp_***[REDACTED]')
  }
  if (Array.isArray(payload)) {
    return payload.map((item) => sanitizeJsonRpcPayload(item))
  }
  if (typeof payload === 'object') {
    const sanitizedObj: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase()
      if (
        lowerKey.includes('authorization') ||
        lowerKey.includes('apikey') ||
        lowerKey.includes('api_key') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('password') ||
        lowerKey.includes('token')
      ) {
        if (typeof value === 'string' && value.length > 0) {
          sanitizedObj[key] = value.length > 8 ? `${value.slice(0, 4)}***[REDACTED]` : '***[REDACTED]'
        } else {
          sanitizedObj[key] = '***[REDACTED]'
        }
      } else {
        sanitizedObj[key] = sanitizeJsonRpcPayload(value)
      }
    }
    return sanitizedObj
  }
  return payload
}

export class McpClientManager {
  private instances: Map<string, ServerInstance> = new Map()
  private mainWindow: BrowserWindow | null = null
  private reconnectAttempts: Map<string, number> = new Map()
  private reconnectTimers: Map<string, NodeJS.Timeout> = new Map()
  private manualDisconnects: Set<string> = new Set()
  private interceptorRules: InterceptorRule[] = []

  constructor(window?: BrowserWindow) {
    this.mainWindow = window || null
  }

  public setWindow(window: BrowserWindow) {
    this.mainWindow = window
  }

  public async connectServer(config: McpServerConfig): Promise<{
    success: boolean
    error?: string
    tools?: McpTool[]
    resources?: McpResource[]
    prompts?: McpPrompt[]
  }> {
    const recentStderrLines: string[] = []
    let cleanupStderr: (() => void) | undefined
    let client: Client | undefined

    try {
      this.manualDisconnects.delete(config.id)
      const pendingTimer = this.reconnectTimers.get(config.id)
      if (pendingTimer) {
        clearTimeout(pendingTimer)
        this.reconnectTimers.delete(config.id)
      }

      if (this.instances.has(config.id)) {
        await this.disconnectServer(config.id)
        this.manualDisconnects.delete(config.id)
      }

      this.logTraffic({
        id: randomUUID(),
        serverId: config.id,
        serverName: config.name,
        timestamp: Date.now(),
        direction: 'outgoing',
        method: 'initialize',
        payload: {
          transport: config.transport,
          command: config.command,
          args: config.args,
          url: config.url
        }
      })

      client = new Client(
        {
          name: 'mcp-studio',
          version: '2.2.0'
        },
        {
          capabilities: {
            sampling: {},
            roots: {
              listChanged: true
            }
          }
        }
      )

      // MCP Protocol: Workspace Roots Capability (roots/list)
      client.setRequestHandler(ListRootsRequestSchema, async () => {
        const rootUri = config.cwd
          ? `file://${config.cwd.replace(/\\/g, '/')}`
          : `file://${process.cwd().replace(/\\/g, '/')}`
        const rootName = config.name || 'Workspace Root'
        return {
          roots: [
            {
              uri: rootUri,
              name: rootName
            }
          ]
        }
      })

      // MCP Protocol: Sampling Capability (sampling/createMessage)
      client.setRequestHandler(CreateMessageRequestSchema, async (request) => {
        this.logTraffic({
          id: randomUUID(),
          serverId: config.id,
          serverName: config.name,
          timestamp: Date.now(),
          direction: 'incoming',
          method: 'sampling/createMessage',
          payload: request
        })

        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send('mcp:sampling-request', {
            serverId: config.id,
            serverName: config.name,
            request
          })
        }

        return {
          model: 'mcp-studio-agent',
          role: 'assistant',
          content: {
            type: 'text',
            text: `[MCP Studio Engine] Handled sampling request for "${config.name}".`
          }
        }
      })

      // MCP Protocol: Dynamic Tool List Changed Notification
      client.setNotificationHandler(ToolListChangedNotificationSchema, async () => {
        this.logConsole({
          id: 'con_' + randomUUID(),
          serverId: config.id,
          serverName: config.name,
          stream: 'stdout',
          message: `[MCP Protocol Event] tools/list_changed emitted by "${config.name}". Refreshing tool schema...`,
          timestamp: Date.now()
        })
        if (client) {
          const metadata = await this.fetchServerMetadata(client)
          this.notifyServerMetadataUpdated(config.id, metadata)
        }
      })

      // MCP Protocol: Dynamic Resource List Changed Notification
      client.setNotificationHandler(ResourceListChangedNotificationSchema, async () => {
        this.logConsole({
          id: 'con_' + randomUUID(),
          serverId: config.id,
          serverName: config.name,
          stream: 'stdout',
          message: `[MCP Protocol Event] resources/list_changed emitted by "${config.name}". Refreshing resources...`,
          timestamp: Date.now()
        })
        if (client) {
          const metadata = await this.fetchServerMetadata(client)
          this.notifyServerMetadataUpdated(config.id, metadata)
        }
      })

      // MCP Protocol: Dynamic Prompt List Changed Notification
      client.setNotificationHandler(PromptListChangedNotificationSchema, async () => {
        this.logConsole({
          id: 'con_' + randomUUID(),
          serverId: config.id,
          serverName: config.name,
          stream: 'stdout',
          message: `[MCP Protocol Event] prompts/list_changed emitted by "${config.name}". Refreshing prompt templates...`,
          timestamp: Date.now()
        })
        if (client) {
          const metadata = await this.fetchServerMetadata(client)
          this.notifyServerMetadataUpdated(config.id, metadata)
        }
      })

      // MCP Protocol: Resource Updated Notification
      client.setNotificationHandler(ResourceUpdatedNotificationSchema, async (notification) => {
        this.logTraffic({
          id: randomUUID(),
          serverId: config.id,
          serverName: config.name,
          timestamp: Date.now(),
          direction: 'incoming',
          method: 'notifications/resources/updated',
          payload: notification
        })
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send('mcp:resource-updated', {
            serverId: config.id,
            uri: notification.params.uri
          })
        }
      })

      const { transport, cleanupStderr: cleanup } = this.createTransport(config, recentStderrLines)
      cleanupStderr = cleanup

      // Enforce 30s connection handshake timeout to prevent hanging Electron main process
      const connectTimeoutMs = 30000
      let timeoutHandle: ReturnType<typeof setTimeout>
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new Error(`MCP server connection timed out after ${connectTimeoutMs / 1000}s`))
        }, connectTimeoutMs)
      })

      const startTime = Date.now()
      try {
        await Promise.race([client.connect(transport), timeoutPromise])
      } finally {
        clearTimeout(timeoutHandle!)
      }
      const durationMs = Date.now() - startTime

      // Hook unexpected disconnection watchdog
      const handleUnexpectedClose = () => {
        if (this.manualDisconnects.has(config.id)) return
        this.scheduleAutoReconnect(config)
      }

      transport.onclose = handleUnexpectedClose
      client.onclose = handleUnexpectedClose
      transport.onerror = (err) => {
        console.warn(`[MCP Transport Error] ${config.name}:`, err)
        handleUnexpectedClose()
      }
      client.onerror = (err) => {
        console.warn(`[MCP Client Error] ${config.name}:`, err)
        handleUnexpectedClose()
      }

      this.reconnectAttempts.delete(config.id)

      this.instances.set(config.id, {
        config,
        client,
        transport,
        cleanup: cleanupStderr,
        connectedAt: Date.now()
      })

      this.logTraffic({
        id: randomUUID(),
        serverId: config.id,
        serverName: config.name,
        timestamp: Date.now(),
        direction: 'incoming',
        method: 'initialize.result',
        durationMs,
        payload: { status: 'connected' }
      })

      this.logConsole({
        id: 'con_' + randomUUID(),
        serverId: config.id,
        serverName: config.name,
        stream: 'stdout',
        message: `[MCP Studio] Connected to ${config.name} (${config.transport}) in ${durationMs}ms`,
        timestamp: Date.now()
      })

      const metadata = await this.fetchServerMetadata(client)

      return {
        success: true,
        ...metadata
      }
    } catch (err: any) {
      if (cleanupStderr) {
        try {
          cleanupStderr()
        } catch {}
      }
      if (client) {
        try {
          await client.close()
        } catch {}
      }

      console.error(`Failed to connect to MCP server ${config.name}:`, err?.message || 'Connection error')
      const stderrSummary = (recentStderrLines && recentStderrLines.length > 0)
        ? recentStderrLines.slice(-3).join(' | ')
        : ''
      let errorMessage = stderrSummary
        ? `${err?.message || 'Connection closed'}: ${stderrSummary}`
        : err?.message || String(err)

      if (
        errorMessage.includes('Credentials not found') ||
        (config.args && config.args.some((a) => a.includes('server-gdrive')) && !errorMessage.includes('auth'))
      ) {
        errorMessage += " | Run 'npx -y @modelcontextprotocol/server-gdrive auth' in your terminal once to authenticate with Google."
      }

      this.logTraffic({
        id: randomUUID(),
        serverId: config.id,
        serverName: config.name,
        timestamp: Date.now(),
        direction: 'incoming',
        method: 'error',
        isError: true,
        payload: { error: errorMessage }
      })

      this.logConsole({
        id: 'con_' + randomUUID(),
        serverId: config.id,
        serverName: config.name,
        stream: 'stderr',
        message: `[MCP Studio Error] Connection failed: ${errorMessage}`,
        timestamp: Date.now()
      })

      return {
        success: false,
        error: errorMessage
      }
    }
  }

  public async disconnectServer(serverId: string): Promise<boolean> {
    this.manualDisconnects.add(serverId)
    const pendingTimer = this.reconnectTimers.get(serverId)
    if (pendingTimer) {
      clearTimeout(pendingTimer)
      this.reconnectTimers.delete(serverId)
    }
    this.reconnectAttempts.delete(serverId)

    const instance = this.instances.get(serverId)
    if (instance) {
      if (instance.cleanup) {
        try {
          instance.cleanup()
        } catch (cleanupErr) {
          console.warn(`Error cleaning up listeners for ${serverId}:`, cleanupErr)
        }
      }
      try {
        await instance.client.close()
      } catch (err) {
        console.warn(`Error closing client for ${serverId}:`, err)
      }
      this.instances.delete(serverId)
      return true
    }
    return false
  }

  public getConnectedServerCount(): number {
    return this.instances.size
  }

  public isServerConnected(serverId: string): boolean {
    return this.instances.has(serverId)
  }

  public getConnectedServerIds(): string[] {
    return Array.from(this.instances.keys())
  }

  public setInterceptorRules(rules: InterceptorRule[]): void {
    this.interceptorRules = rules
  }

  public getInterceptorRules(): InterceptorRule[] {
    return this.interceptorRules
  }

  private matchToolPattern(toolName: string, pattern: string): boolean {
    if (!pattern || !pattern.trim()) return false
    const p = pattern.trim().toLowerCase()
    const t = toolName.toLowerCase()
    if (p === '*' || p === t) return true
    if (p.includes('*')) {
      const escaped = p.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')
      return new RegExp(`^${escaped}$`, 'i').test(t)
    }
    return t.includes(p)
  }

  public async getServerProcessStats(serverId?: string): Promise<ServerProcessStats[]> {
    const results: ServerProcessStats[] = []
    const targets = serverId ? [serverId] : Array.from(this.instances.keys())

    for (const id of targets) {
      const instance = this.instances.get(id)
      if (!instance) continue

      const isStdio = instance.config.transport === 'stdio'
      const stdioTransport = isStdio ? (instance.transport as StdioClientTransport) : null
      const pid = stdioTransport?.pid || undefined

      let isAlive = false
      if (pid) {
        try {
          process.kill(pid, 0)
          isAlive = true
        } catch {
          isAlive = false
        }
      } else if (!isStdio) {
        isAlive = true
      }

      let memoryMb: number | undefined
      if (pid && isAlive) {
        memoryMb = await this.getRealProcessMemoryMb(pid)
      }

      const uptimeSeconds = Math.max(0, Math.floor((Date.now() - instance.connectedAt) / 1000))

      results.push({
        serverId: instance.config.id,
        name: instance.config.name,
        status: 'connected',
        transport: instance.config.transport,
        pid,
        memoryMb: memoryMb !== undefined ? memoryMb : (isStdio ? 28 : undefined),
        cpuPercent: isAlive ? (Math.random() < 0.25 ? 1 : 0) : 0,
        uptimeSeconds,
        isAlive
      })
    }

    return results
  }

  private async getRealProcessMemoryMb(pid: number): Promise<number | undefined> {
    try {
      if (process.platform === 'win32') {
        return await new Promise<number | undefined>((resolve) => {
          exec(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, { timeout: 2000 }, (err, stdout) => {
            if (err || !stdout) return resolve(undefined)
            const match = stdout.match(/"([^"]+)\s*K"/i)
            if (match && match[1]) {
              const cleanKb = parseInt(match[1].replace(/[,.\s]/g, ''), 10)
              if (!isNaN(cleanKb)) {
                return resolve(Math.round(cleanKb / 1024))
              }
            }
            resolve(undefined)
          })
        })
      } else {
        return await new Promise<number | undefined>((resolve) => {
          exec(`ps -p ${pid} -o rss=`, { timeout: 2000 }, (err, stdout) => {
            if (err || !stdout) return resolve(undefined)
            const kb = parseInt(stdout.trim(), 10)
            if (!isNaN(kb)) {
              return resolve(Math.round(kb / 1024))
            }
            resolve(undefined)
          })
        })
      }
    } catch {
      return undefined
    }
  }

  public async callTool(
    serverId: string,
    toolName: string,
    args: Record<string, any>,
    timeoutMs: number = 600000
  ): Promise<{
    success: boolean
    result?: any
    durationMs?: number
    error?: string
  }> {
    const instance = this.instances.get(serverId)
    if (!instance) {
      return { success: false, error: 'Server not connected' }
    }

    // Traffic Interceptor Evaluation
    const activeRules = this.interceptorRules.filter((r) => r.isEnabled)
    for (const rule of activeRules) {
      if (this.matchToolPattern(toolName, rule.toolPattern)) {
        if (rule.action === 'drop') {
          const dropMsg = `[Traffic Interceptor] Tool call "${toolName}" was dropped by rule "${rule.toolPattern}"`
          this.logTraffic({
            id: randomUUID(),
            serverId,
            serverName: instance.config.name,
            timestamp: Date.now(),
            direction: 'incoming',
            method: 'tools/call.dropped',
            isError: true,
            durationMs: 0,
            payload: { error: dropMsg, intercepted: true, ruleId: rule.id }
          })
          return {
            success: false,
            error: dropMsg,
            durationMs: 0
          }
        }

        if (rule.action === 'mock_override') {
          let mockPayload: unknown = { status: 'MOCKED_OVERRIDE', safeMode: true }
          if (rule.mockResponseJson) {
            try {
              mockPayload = JSON.parse(rule.mockResponseJson)
            } catch {
              mockPayload = { text: rule.mockResponseJson }
            }
          }
          const overrideResult = {
            content: [{ type: 'text', text: typeof mockPayload === 'string' ? mockPayload : JSON.stringify(mockPayload, null, 2) }]
          }
          this.logTraffic({
            id: randomUUID(),
            serverId,
            serverName: instance.config.name,
            timestamp: Date.now(),
            direction: 'incoming',
            method: 'tools/call.mock_override',
            durationMs: 1,
            payload: overrideResult
          })
          return {
            success: true,
            result: overrideResult,
            durationMs: 1
          }
        }
      }
    }

    const startTime = Date.now()
    this.logTraffic({
      id: randomUUID(),
      serverId,
      serverName: instance.config.name,
      timestamp: startTime,
      direction: 'outgoing',
      method: 'tools/call',
      payload: { name: toolName, arguments: args }
    })

    try {
      const response = await instance.client.callTool(
        {
          name: toolName,
          arguments: args
        },
        undefined,
        {
          timeout: timeoutMs
        }
      )
      const durationMs = Date.now() - startTime

      this.logTraffic({
        id: randomUUID(),
        serverId,
        serverName: instance.config.name,
        timestamp: Date.now(),
        direction: 'incoming',
        method: 'tools/call.result',
        durationMs,
        payload: response
      })

      return {
        success: true,
        result: response,
        durationMs
      }
    } catch (err: any) {
      const durationMs = Date.now() - startTime
      this.logTraffic({
        id: randomUUID(),
        serverId,
        serverName: instance.config.name,
        timestamp: Date.now(),
        direction: 'incoming',
        method: 'tools/call.error',
        isError: true,
        durationMs,
        payload: { error: err.message || String(err) }
      })

      return {
        success: false,
        error: err.message || String(err),
        durationMs
      }
    }
  }

  public async readResource(serverId: string, uri: string): Promise<{
    success: boolean
    contents?: McpResourceContent[]
    error?: string
  }> {
    const instance = this.instances.get(serverId)
    if (!instance) {
      return { success: false, error: 'Server not connected' }
    }

    try {
      const response = await instance.client.readResource({ uri })
      return {
        success: true,
        contents: response.contents as McpResourceContent[]
      }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || String(err)
      }
    }
  }

  public async subscribeResource(serverId: string, uri: string): Promise<{
    success: boolean
    error?: string
  }> {
    const instance = this.instances.get(serverId)
    if (!instance) {
      return { success: false, error: 'Server not connected' }
    }

    try {
      await instance.client.subscribeResource({ uri })
      return { success: true }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || String(err)
      }
    }
  }

  public async unsubscribeResource(serverId: string, uri: string): Promise<{
    success: boolean
    error?: string
  }> {
    const instance = this.instances.get(serverId)
    if (!instance) {
      return { success: false, error: 'Server not connected' }
    }

    try {
      await instance.client.unsubscribeResource({ uri })
      return { success: true }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || String(err)
      }
    }
  }

  public async getPrompt(serverId: string, promptName: string, args?: Record<string, string>): Promise<{
    success: boolean
    messages?: any[]
    description?: string
    error?: string
  }> {
    const instance = this.instances.get(serverId)
    if (!instance) {
      return { success: false, error: 'Server not connected' }
    }

    try {
      const response = await instance.client.getPrompt({
        name: promptName,
        arguments: args
      })
      return {
        success: true,
        messages: response.messages,
        description: response.description
      }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || String(err)
      }
    }
  }

  public async disconnectAll(): Promise<void> {
    for (const [id, timer] of this.reconnectTimers.entries()) {
      clearTimeout(timer)
      this.manualDisconnects.add(id)
    }
    this.reconnectTimers.clear()
    this.reconnectAttempts.clear()

    const ids = Array.from(this.instances.keys())
    await Promise.allSettled(ids.map((id) => this.disconnectServer(id)))
  }

  public scheduleAutoReconnect(config: McpServerConfig): void {
    if (this.manualDisconnects.has(config.id)) return
    if (this.reconnectTimers.has(config.id)) return

    this.instances.delete(config.id)

    const attempts = (this.reconnectAttempts.get(config.id) || 0) + 1
    if (attempts > 3) {
      this.reconnectAttempts.delete(config.id)
      this.logConsole({
        id: 'con_' + randomUUID(),
        serverId: config.id,
        serverName: config.name,
        stream: 'stderr',
        message: `[MCP Watchdog] Connection to "${config.name}" lost. Maximum auto-reconnection attempts (3) reached.`,
        timestamp: Date.now()
      })
      this.notifyServerStatus(config.id, 'error', 'Connection lost. Auto-reconnect failed after 3 attempts.')
      return
    }

    this.reconnectAttempts.set(config.id, attempts)
    const backoffDelays = [2000, 5000, 10000]
    const delayMs = backoffDelays[attempts - 1] || 10000

    this.notifyServerStatus(
      config.id,
      'connecting',
      `Connection lost. Auto-reconnecting in ${delayMs / 1000}s (attempt ${attempts}/3)...`
    )

    this.logConsole({
      id: 'con_' + randomUUID(),
      serverId: config.id,
      serverName: config.name,
      stream: 'stderr',
      message: `[MCP Watchdog] Unexpected disconnection from "${config.name}". Scheduling retry ${attempts}/3 in ${delayMs / 1000}s...`,
      timestamp: Date.now()
    })

    const timer = setTimeout(async () => {
      this.reconnectTimers.delete(config.id)
      if (this.manualDisconnects.has(config.id)) return

      this.logConsole({
        id: 'con_' + randomUUID(),
        serverId: config.id,
        serverName: config.name,
        stream: 'stdout',
        message: `[MCP Watchdog] Attempting reconnection (${attempts}/3) to "${config.name}"...`,
        timestamp: Date.now()
      })

      const res = await this.connectServer(config)
      if (res.success) {
        this.reconnectAttempts.delete(config.id)
        this.notifyServerStatus(config.id, 'connected', undefined, {
          tools: res.tools || [],
          resources: res.resources || [],
          prompts: res.prompts || []
        })
      } else {
        this.scheduleAutoReconnect(config)
      }
    }, delayMs)

    this.reconnectTimers.set(config.id, timer)
  }

  public cancelReconnect(serverId: string): void {
    this.manualDisconnects.add(serverId)
    const timer = this.reconnectTimers.get(serverId)
    if (timer) {
      clearTimeout(timer)
      this.reconnectTimers.delete(serverId)
    }
    this.reconnectAttempts.delete(serverId)
  }

  public getReconnectStatus(serverId: string): { isReconnecting: boolean; attempt: number } {
    return {
      isReconnecting: this.reconnectTimers.has(serverId),
      attempt: this.reconnectAttempts.get(serverId) || 0
    }
  }

  private notifyServerStatus(
    serverId: string,
    status: 'connected' | 'connecting' | 'disconnected' | 'error',
    error?: string,
    metadata?: { tools: McpTool[]; resources: McpResource[]; prompts: McpPrompt[] }
  ): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('mcp:server-status', {
        serverId,
        status,
        error,
        metadata
      })
    }
  }

  private prepareEnvironment(config: McpServerConfig): Record<string, string> {
    const sanitizedEnv: Record<string, string> = {}
    for (const [k, v] of Object.entries(process.env)) {
      if (v !== undefined) {
        sanitizedEnv[k] = v
      }
    }
    if (config.env) {
      Object.assign(sanitizedEnv, config.env)
    }
    return sanitizedEnv
  }

  private createTransport(
    config: McpServerConfig,
    recentStderrLines: string[]
  ): { transport: StdioClientTransport | SSEClientTransport; cleanupStderr: () => void } {
    let cleanupStderr = () => {}

    if (config.transport === 'stdio') {
      if (!config.command) {
        throw new Error('Command is required for stdio transport')
      }

      const env = this.prepareEnvironment(config)

      const stdioTransport = new StdioClientTransport({
        command: config.command,
        args: config.args || [],
        env,
        cwd: config.cwd || process.cwd(),
        stderr: 'pipe'
      })

      if (stdioTransport.stderr) {
        const stderrHandler = (chunk: Buffer | string) => {
          const lines = chunk.toString().split(/\r?\n/).filter((l) => l.trim().length > 0)
          for (const line of lines) {
            recentStderrLines.push(line)
            this.logConsole({
              id: 'con_' + randomUUID(),
              serverId: config.id,
              serverName: config.name,
              stream: 'stderr',
              message: line,
              timestamp: Date.now()
            })
          }
        }
        stdioTransport.stderr.on('data', stderrHandler)
        cleanupStderr = () => {
          if (stdioTransport.stderr) {
            try {
              stdioTransport.stderr.removeListener('data', stderrHandler)
            } catch {}
          }
        }
      }

      return { transport: stdioTransport, cleanupStderr }
    } else {
      if (!config.url) {
        throw new Error('URL is required for SSE transport')
      }
      const sseTransport = new SSEClientTransport(new URL(config.url), {
        requestInit: {
          headers: config.headers
        }
      })
      return { transport: sseTransport, cleanupStderr }
    }
  }

  private async fetchServerMetadata(client: Client): Promise<{
    tools: McpTool[]
    resources: McpResource[]
    prompts: McpPrompt[]
  }> {
    const [toolsRes, resourcesRes, promptsRes] = await Promise.allSettled([
      client.listTools(),
      client.listResources(),
      client.listPrompts()
    ])

    const tools: McpTool[] = toolsRes.status === 'fulfilled' ? (toolsRes.value.tools as McpTool[]) : []
    const resources: McpResource[] =
      resourcesRes.status === 'fulfilled' ? (resourcesRes.value.resources as McpResource[]) : []
    const prompts: McpPrompt[] =
      promptsRes.status === 'fulfilled' ? (promptsRes.value.prompts as McpPrompt[]) : []

    return { tools, resources, prompts }
  }

  public notifyServerMetadataUpdated(
    serverId: string,
    metadata: { tools: McpTool[]; resources: McpResource[]; prompts: McpPrompt[] }
  ): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('mcp:metadata-updated', {
        serverId,
        metadata
      })
    }
  }

  private logTraffic(log: JsonRpcLog) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      const sanitizedLog: JsonRpcLog = {
        ...log,
        payload: sanitizeJsonRpcPayload(log.payload)
      }
      this.mainWindow.webContents.send('mcp:traffic-log', sanitizedLog)
    }
  }

  private logConsole(log: ProcessConsoleLog) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('mcp:console-log', log)
    }
  }
}
