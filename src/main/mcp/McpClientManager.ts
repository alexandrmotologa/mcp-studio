import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import {
  McpServerConfig,
  McpTool,
  McpResource,
  McpResourceContent,
  McpPrompt,
  JsonRpcLog,
  ProcessConsoleLog
} from '../../shared/types'
import { BrowserWindow } from 'electron'
import { randomUUID } from 'crypto'

interface ServerInstance {
  config: McpServerConfig
  client: Client
  transport: StdioClientTransport | SSEClientTransport
  cleanup?: () => void
}

export class McpClientManager {
  private instances: Map<string, ServerInstance> = new Map()
  private mainWindow: BrowserWindow | null = null
  private reconnectAttempts: Map<string, number> = new Map()
  private reconnectTimers: Map<string, NodeJS.Timeout> = new Map()
  private manualDisconnects: Set<string> = new Set()

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
          version: '2.0.3'
        },
        {
          capabilities: {}
        }
      )

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
        cleanup: cleanupStderr
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

  private logTraffic(log: JsonRpcLog) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('mcp:traffic-log', log)
    }
  }

  private logConsole(log: ProcessConsoleLog) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('mcp:console-log', log)
    }
  }
}
