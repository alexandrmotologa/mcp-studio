import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import {
  ClientSyncTarget,
  ClientSyncTargetId,
  ClientSyncDiff,
  ClientSyncResult,
  McpServerConfig
} from '../../shared/types'

interface TargetConfigMeta {
  id: ClientSyncTargetId
  name: string
  format: 'claude_mcpServers' | 'cursor_mcpServers' | 'zed_contextServers' | 'antigravity_mcpServers'
  resolvePath: () => string
}

export class McpConfigWriter {
  private static getTargetsMetadata(): TargetConfigMeta[] {
    const home = os.homedir()
    const platform = os.platform()

    return [
      {
        id: 'antigravity',
        name: 'Google Antigravity IDE',
        format: 'antigravity_mcpServers',
        resolvePath: () => {
          const defaultPath = path.join(home, '.gemini', 'antigravity-ide', 'mcp_config.json')
          const candidates = [
            defaultPath,
            path.join(home, '.gemini', 'config', 'mcp_config.json'),
            path.join(home, '.gemini', 'mcp_config.json')
          ]
          for (const c of candidates) {
            if (fs.existsSync(c)) return c
          }
          return defaultPath
        }
      },
      {
        id: 'claude-desktop',
        name: 'Claude Desktop',
        format: 'claude_mcpServers',
        resolvePath: () => {
          if (platform === 'win32') {
            const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming')
            return path.join(appData, 'Claude', 'claude_desktop_config.json')
          } else if (platform === 'darwin') {
            return path.join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json')
          }
          return path.join(home, '.config', 'Claude', 'claude_desktop_config.json')
        }
      },
      {
        id: 'cursor',
        name: 'Cursor IDE',
        format: 'cursor_mcpServers',
        resolvePath: () => {
          const dotCursor = path.join(home, '.cursor', 'mcp.json')
          if (fs.existsSync(dotCursor)) return dotCursor
          if (platform === 'win32') {
            const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming')
            return path.join(appData, 'Cursor', 'mcp.json')
          }
          return dotCursor
        }
      },
      {
        id: 'windsurf',
        name: 'Windsurf IDE (Codeium)',
        format: 'claude_mcpServers',
        resolvePath: () => {
          const p1 = path.join(home, '.codeium', 'windsurf', 'mcp_config.json')
          if (fs.existsSync(p1)) return p1
          return path.join(home, '.windsurf', 'mcp_config.json')
        }
      },
      {
        id: 'zed',
        name: 'Zed IDE',
        format: 'zed_contextServers',
        resolvePath: () => {
          if (platform === 'win32') {
            const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming')
            return path.join(appData, 'Zed', 'settings.json')
          }
          return path.join(home, '.config', 'zed', 'settings.json')
        }
      },
      {
        id: 'cline',
        name: 'VS Code (Cline)',
        format: 'claude_mcpServers',
        resolvePath: () => {
          if (platform === 'win32') {
            const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming')
            return path.join(appData, 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json')
          } else if (platform === 'darwin') {
            return path.join(home, 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json')
          }
          return path.join(home, '.config', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json')
        }
      },
      {
        id: 'roo-code',
        name: 'VS Code (Roo Code)',
        format: 'claude_mcpServers',
        resolvePath: () => {
          if (platform === 'win32') {
            const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming')
            return path.join(appData, 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'cline_mcp_settings.json')
          } else if (platform === 'darwin') {
            return path.join(home, 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'cline_mcp_settings.json')
          }
          return path.join(home, '.config', 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'cline_mcp_settings.json')
        }
      },
      {
        id: 'continue',
        name: 'Continue.dev',
        format: 'claude_mcpServers',
        resolvePath: () => {
          const mcpPath = path.join(home, '.continue', 'mcp.json')
          if (fs.existsSync(mcpPath)) return mcpPath
          return path.join(home, '.continue', 'config.json')
        }
      }
    ]
  }

  /**
   * List all detectable sync targets and their availability status.
   */
  public static async listSyncTargets(): Promise<ClientSyncTarget[]> {
    const metas = this.getTargetsMetadata()
    const targets: ClientSyncTarget[] = []

    for (const meta of metas) {
      const configPath = meta.resolvePath()
      const exists = fs.existsSync(configPath)
      let isWritable = false
      let installedServerCount = 0

      if (exists) {
        try {
          await fs.promises.access(configPath, fs.constants.W_OK)
          isWritable = true
          const content = await fs.promises.readFile(configPath, 'utf8')
          const parsed = JSON.parse(content)
          const servers = meta.format === 'zed_contextServers'
            ? parsed.context_servers || parsed.contextServers
            : parsed.mcpServers || parsed.servers
          if (servers && typeof servers === 'object') {
            installedServerCount = Object.keys(servers).length
          }
        } catch {
          isWritable = false
        }
      } else {
        // Check if parent directory is writable or can be created
        try {
          const dir = path.dirname(configPath)
          if (fs.existsSync(dir)) {
            await fs.promises.access(dir, fs.constants.W_OK)
            isWritable = true
          }
        } catch {
          isWritable = false
        }
      }

      targets.push({
        id: meta.id,
        name: meta.name,
        configFilePath: configPath,
        exists,
        isWritable,
        installedServerCount,
        format: meta.format
      })
    }

    return targets
  }

  /**
   * Format server config to client target format.
   */
  public static formatServerForTarget(
    server: McpServerConfig,
    format: ClientSyncTarget['format']
  ): Record<string, any> {
    if (format === 'zed_contextServers') {
      if (server.transport === 'sse') {
        return {
          url: server.url,
          headers: server.headers || {}
        }
      }
      return {
        command: server.command,
        args: server.args || [],
        env: server.env || {}
      }
    }

    // Standard mcpServers format (Claude, Cursor, Antigravity, etc.)
    if (server.transport === 'sse') {
      return {
        url: server.url,
        headers: server.headers
      }
    }

    const entry: Record<string, any> = {
      command: server.command,
      args: server.args || []
    }
    if (server.env && Object.keys(server.env).length > 0) {
      entry.env = server.env
    }
    if (server.cwd) {
      entry.cwd = server.cwd
    }
    return entry
  }

  /**
   * Generate diff before writing back to client config.
   */
  public static async previewClientConfigDiff(
    targetId: ClientSyncTargetId,
    studioServers: McpServerConfig[],
    customPath?: string
  ): Promise<ClientSyncDiff> {
    const meta = this.getTargetsMetadata().find((t) => t.id === targetId)
    if (!meta) {
      throw new Error(`Unknown client sync target: ${targetId}`)
    }

    const configPath = customPath || meta.resolvePath()
    let existingObj: Record<string, any> = {}
    let beforeJson = '{}'

    if (fs.existsSync(configPath)) {
      try {
        const raw = await fs.promises.readFile(configPath, 'utf8')
        existingObj = JSON.parse(raw)
        beforeJson = JSON.stringify(existingObj, null, 2)
      } catch (err) {
        throw new Error(
          `Failed to parse target client config at ${configPath}: ${err instanceof Error ? err.message : String(err)}`,
          { cause: err }
        )
      }
    }

    const afterObj = JSON.parse(JSON.stringify(existingObj))
    const serverContainerKey = meta.format === 'zed_contextServers' ? 'context_servers' : 'mcpServers'
    if (!afterObj[serverContainerKey] || typeof afterObj[serverContainerKey] !== 'object') {
      afterObj[serverContainerKey] = {}
    }

    const currentMap = afterObj[serverContainerKey]
    const serversToAdd: string[] = []
    const serversToUpdate: string[] = []
    const serversUnchanged: string[] = []

    for (const server of studioServers) {
      const serverKey = server.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-')
      const formatted = this.formatServerForTarget(server, meta.format)

      if (!currentMap[serverKey]) {
        serversToAdd.push(server.name)
      } else {
        const existingStr = JSON.stringify(currentMap[serverKey])
        const newStr = JSON.stringify(formatted)
        if (existingStr !== newStr) {
          serversToUpdate.push(server.name)
        } else {
          serversUnchanged.push(server.name)
        }
      }

      currentMap[serverKey] = formatted
    }

    const afterJson = JSON.stringify(afterObj, null, 2)

    return {
      targetId,
      targetName: meta.name,
      configFilePath: configPath,
      serversToAdd,
      serversToUpdate,
      serversUnchanged,
      beforeJson,
      afterJson
    }
  }

  /**
   * Perform safe atomic write-back with timestamped backup.
   */
  public static async syncConfigToClient(
    targetId: ClientSyncTargetId,
    studioServers: McpServerConfig[],
    customPath?: string
  ): Promise<ClientSyncResult> {
    try {
      const diff = await this.previewClientConfigDiff(targetId, studioServers, customPath)
      const targetPath = diff.configFilePath
      const targetDir = path.dirname(targetPath)

      if (!fs.existsSync(targetDir)) {
        await fs.promises.mkdir(targetDir, { recursive: true })
      }

      let backupFilePath: string | undefined

      // Create backup if target file exists
      if (fs.existsSync(targetPath)) {
        const timestamp = Date.now()
        backupFilePath = `${targetPath}.bak.${timestamp}`
        await fs.promises.copyFile(targetPath, backupFilePath)
      }

      // Write to temporary file in the same directory for atomic rename
      const tempPath = path.join(
        targetDir,
        `.tmp_${path.basename(targetPath)}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
      )

      await fs.promises.writeFile(tempPath, diff.afterJson, 'utf8')
      await fs.promises.rename(tempPath, targetPath)

      return {
        success: true,
        targetId,
        backupFilePath,
        modifiedFilePath: targetPath,
        syncedServerCount: studioServers.length
      }
    } catch (error) {
      return {
        success: false,
        targetId,
        modifiedFilePath: '',
        syncedServerCount: 0,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }
}
