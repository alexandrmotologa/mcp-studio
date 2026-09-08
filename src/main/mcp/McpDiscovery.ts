import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { McpServerConfig } from '../../shared/types'

interface RawServerEntry {
  command?: string
  args?: string[]
  env?: Record<string, string>
  cwd?: string
  transport?: 'stdio' | 'sse'
  url?: string
  serverUrl?: string
  headers?: Record<string, string>
  type?: string
}

export class McpDiscovery {
  public static async discoverInstalledServers(): Promise<{
    source: string
    servers: Omit<McpServerConfig, 'id' | 'status' | 'createdAt'>[]
  }[]> {
    const results: {
      source: string
      servers: Omit<McpServerConfig, 'id' | 'status' | 'createdAt'>[]
    }[] = []

    const candidateSources: {
      name: string
      paths: (string | null)[]
      parser?: (content: string) => Record<string, RawServerEntry> | null
    }[] = [
      // 1. Google Antigravity & Gemini CLI
      {
        name: 'Google Antigravity IDE',
        paths: this.getAntigravityConfigPaths()
      },
      // 2. Cursor IDE
      {
        name: 'Cursor IDE',
        paths: this.getCursorConfigPaths()
      },
      // 3. Claude Desktop
      {
        name: 'Claude Desktop',
        paths: this.getClaudeConfigPaths()
      },
      // 4. Windsurf (Codeium)
      {
        name: 'Windsurf IDE (Codeium)',
        paths: this.getWindsurfConfigPaths()
      },
      // 5. OpenCode & Z.AI
      {
        name: 'OpenCode / Z.AI',
        paths: this.getOpenCodeConfigPaths()
      },
      // 6. OpenAI Codex / Custom Configs
      {
        name: 'Codex / AI Agents',
        paths: this.getCodexConfigPaths()
      },
      // 7. VS Code Extensions (Cline / Claude Dev)
      {
        name: 'VS Code (Cline / Claude Dev)',
        paths: this.getClineConfigPaths()
      },
      // 8. VS Code (Roo Code)
      {
        name: 'VS Code (Roo Code)',
        paths: this.getRooCodeConfigPaths()
      },
      // 9. Continue.dev
      {
        name: 'Continue.dev',
        paths: this.getContinueConfigPaths()
      },
      // 10. Zed IDE
      {
        name: 'Zed IDE',
        paths: this.getZedConfigPaths(),
        parser: this.parseZedConfig
      },
      // 11. Current Workspace MCP Files
      {
        name: 'Active Project Workspace',
        paths: this.getWorkspaceConfigPaths()
      }
    ]

    const processedSources = new Set<string>()
    const globalSeenFingerprints = new Set<string>()

    const getFingerprint = (s: Omit<McpServerConfig, 'id' | 'status' | 'createdAt'>): string => {
      if (s.transport === 'sse') {
        return `sse:${(s.url || '').trim().toLowerCase()}`
      }
      const cmd = ((s as any).command || '').trim().toLowerCase()
      const args = ((s as any).args || []).map((a: string) => a.trim().toLowerCase()).join(' ')
      return `stdio:${cmd}:${args}`
    }

    for (const source of candidateSources) {
      const validPaths = source.paths.filter((p): p is string => Boolean(p && fs.existsSync(p)))
      if (validPaths.length === 0) continue

      const allServersForSource: Omit<McpServerConfig, 'id' | 'status' | 'createdAt'>[] = []

      for (const targetPath of validPaths) {
        try {
          const raw = await fs.promises.readFile(targetPath, 'utf8')
          if (!raw || raw.trim().length === 0) continue

          let serverMap: Record<string, RawServerEntry> | null = null

          if (source.parser) {
            serverMap = source.parser(raw)
          } else {
            const parsed = JSON.parse(raw)
            if (parsed.mcpServers && typeof parsed.mcpServers === 'object') {
              serverMap = parsed.mcpServers
            } else if (parsed.servers && typeof parsed.servers === 'object') {
              serverMap = parsed.servers
            }
          }

          if (serverMap && typeof serverMap === 'object') {
            for (const [name, cfg] of Object.entries(serverMap)) {
              if (!cfg || typeof cfg !== 'object') continue

              const isSse = cfg.transport === 'sse' || Boolean(cfg.serverUrl) || Boolean(cfg.url && !cfg.command)
              const url = cfg.serverUrl || cfg.url

              const serverEntry: Omit<McpServerConfig, 'id' | 'status' | 'createdAt'> = isSse
                ? {
                    name,
                    transport: 'sse',
                    url: url || 'http://localhost:8000',
                    headers: cfg.headers
                  }
                : {
                    name,
                    transport: 'stdio',
                    command: cfg.command || 'node',
                    args: Array.isArray(cfg.args) ? cfg.args : [],
                    env: cfg.env || {},
                    cwd: cfg.cwd
                  }

              const fp = getFingerprint(serverEntry)
              if (!globalSeenFingerprints.has(fp)) {
                globalSeenFingerprints.add(fp)
                allServersForSource.push(serverEntry)
              }
            }
          }
        } catch (err) {
          console.warn(`[McpDiscovery] Could not parse config at ${targetPath}:`, err)
        }
      }

      if (allServersForSource.length > 0 && !processedSources.has(source.name)) {
        processedSources.add(source.name)
        results.push({
          source: source.name,
          servers: allServersForSource
        })
      }
    }

    return results
  }

  // --- Path Resolvers ---

  private static getAntigravityConfigPaths(): string[] {
    const home = os.homedir()
    return [
      path.join(home, '.gemini', 'config', 'mcp_config.json'),
      path.join(home, '.gemini', 'antigravity-ide', 'mcp_config.json'),
      path.join(home, '.gemini', 'mcp_config.json')
    ]
  }

  private static getClaudeConfigPaths(): string[] {
    const home = os.homedir()
    const platform = os.platform()
    if (platform === 'win32') {
      const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming')
      return [path.join(appData, 'Claude', 'claude_desktop_config.json')]
    } else if (platform === 'darwin') {
      return [path.join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json')]
    } else {
      return [path.join(home, '.config', 'Claude', 'claude_desktop_config.json')]
    }
  }

  private static getCursorConfigPaths(): string[] {
    const home = os.homedir()
    const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming')
    return [
      path.join(home, '.cursor', 'mcp.json'),
      path.join(appData, 'Cursor', 'mcp.json'),
      path.join(home, '.config', 'Cursor', 'mcp.json')
    ]
  }

  private static getWindsurfConfigPaths(): string[] {
    const home = os.homedir()
    return [
      path.join(home, '.codeium', 'windsurf', 'mcp_config.json'),
      path.join(home, '.windsurf', 'mcp_config.json'),
      path.join(home, '.windsurf', 'mcp.json')
    ]
  }

  private static getOpenCodeConfigPaths(): string[] {
    const home = os.homedir()
    return [
      path.join(home, '.opencode', 'mcp.json'),
      path.join(home, '.opencode', 'mcp_config.json'),
      path.join(home, '.zai', 'mcp.json'),
      path.join(home, '.zai', 'mcp_config.json')
    ]
  }

  private static getCodexConfigPaths(): string[] {
    const home = os.homedir()
    return [
      path.join(home, '.codex', 'mcp.json'),
      path.join(home, '.codex', 'mcp_config.json'),
      path.join(home, '.codex', 'config.json'),
      path.join(home, '.ai-agent', 'mcp.json')
    ]
  }

  private static getClineConfigPaths(): string[] {
    const home = os.homedir()
    const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming')
    return [
      path.join(appData, 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json'),
      path.join(home, 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json'),
      path.join(home, '.config', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json')
    ]
  }

  private static getRooCodeConfigPaths(): string[] {
    const home = os.homedir()
    const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming')
    return [
      path.join(appData, 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'cline_mcp_settings.json'),
      path.join(home, 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'cline_mcp_settings.json'),
      path.join(home, '.config', 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'cline_mcp_settings.json')
    ]
  }

  private static getContinueConfigPaths(): string[] {
    const home = os.homedir()
    return [
      path.join(home, '.continue', 'config.json'),
      path.join(home, '.continue', 'mcp.json')
    ]
  }

  private static getZedConfigPaths(): string[] {
    const home = os.homedir()
    const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming')
    return [
      path.join(appData, 'Zed', 'settings.json'),
      path.join(home, '.config', 'zed', 'settings.json')
    ]
  }

  private static getWorkspaceConfigPaths(): string[] {
    const cwd = process.cwd()
    return [
      path.join(cwd, '.cursor', 'mcp.json'),
      path.join(cwd, '.vscode', 'mcp.json'),
      path.join(cwd, '.agents', 'mcp_config.json'),
      path.join(cwd, 'mcp.json'),
      path.join(cwd, 'mcp_config.json')
    ]
  }

  private static parseZedConfig(content: string): Record<string, RawServerEntry> | null {
    try {
      const parsed = JSON.parse(content)
      if (parsed.context_servers && typeof parsed.context_servers === 'object') {
        return parsed.context_servers
      }
      return null
    } catch {
      return null
    }
  }
}
