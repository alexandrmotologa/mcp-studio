import {
  McpServerConfig,
  McpTool,
  JsonRpcLog,
  ProcessConsoleLog,
  LicenseStatus,
  SimulationConfig,
  SimulationMessage,
  SavedRequest,
  RequestCollection,
  ToolExecutionHistory,
  EnvironmentProfile,
  TestSuite,
  MockServerConfig,
  UpdateInfoPayload
} from '../../shared/types'

const STUDIO_VERSION = '2.1.5'

export function initBrowserAdapter(): void {
  if (typeof window !== 'undefined' && !window.api) {
    console.info('[MCP Studio] Initializing Web Browser Adapter for window.api')

    const storageKey = (k: string) => `mcp_studio_${k}`

    const getStored = <T>(key: string, defaultVal: T): T => {
      try {
        const item = localStorage.getItem(storageKey(key))
        return item ? JSON.parse(item) : defaultVal
      } catch {
        return defaultVal
      }
    }

    const setStored = <T>(key: string, val: T): void => {
      try {
        localStorage.setItem(storageKey(key), JSON.stringify(val))
      } catch (err) {
        console.error('Failed to persist to localStorage:', err)
      }
    }

    // Default sample environments
    if (!localStorage.getItem(storageKey('environments'))) {
      const defaultEnvs: EnvironmentProfile[] = [
        {
          id: 'env_dev',
          name: 'Development',
          isDefault: true,
          variables: [
            { key: 'API_KEY', value: 'your_dev_api_key_here', enabled: true, isSecret: true },
            { key: 'DB_PORT', value: '5432', enabled: true, isSecret: false },
            { key: 'WORKSPACE_DIR', value: './workspace', enabled: true, isSecret: false }
          ]
        },
        {
          id: 'env_prod',
          name: 'Production',
          variables: [
            { key: 'API_KEY', value: 'your_prod_api_key_here', enabled: true, isSecret: true },
            { key: 'DB_PORT', value: '5432', enabled: true, isSecret: false }
          ]
        }
      ]
      setStored('environments', defaultEnvs)
    }

    // Default sample test suites
    if (!localStorage.getItem(storageKey('test_suites'))) {
      const defaultSuites: TestSuite[] = [
        {
          id: 'suite_database_sanity',
          name: 'Database Operations Regression Suite',
          description: 'Tests SQL execution latency and error handling under concurrency.',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          testCases: [
            {
              id: 'tc_1',
              name: 'SELECT users limit 10',
              serverId: 'demo-sample-server',
              serverName: 'Demo System Tools',
              toolName: 'query_database',
              arguments: { sql: 'SELECT id, username, email FROM users LIMIT 10', maxRows: 10 },
              assertions: [
                { id: 'as_1', type: 'status_success', description: 'Status is success' },
                { id: 'as_2', type: 'max_duration', expectedValue: 500, description: 'Duration under 500ms' }
              ]
            },
            {
              id: 'tc_2',
              name: 'Security audit on auth middleware',
              serverId: 'demo-sample-server',
              serverName: 'Demo System Tools',
              toolName: 'analyze_security',
              arguments: { sourceCode: 'app.use((req, res, next) => { if (!req.headers.auth) return res.status(401); next(); })', severityLevel: 'high' },
              assertions: [
                { id: 'as_3', type: 'status_success', description: 'Audit status success' }
              ]
            }
          ]
        }
      ]
      setStored('test_suites', defaultSuites)
    }

    let trafficListeners: ((log: JsonRpcLog) => void)[] = []
    let consoleListeners: ((log: ProcessConsoleLog) => void)[] = []

    const emitTraffic = (log: JsonRpcLog) => {
      trafficListeners.forEach((fn) => fn(log))
    }

    const emitConsole = (log: ProcessConsoleLog) => {
      consoleListeners.forEach((fn) => fn(log))
    }

    window.api = {
      mcp: {
        connectServer: async (config: McpServerConfig) => {
          emitTraffic({
            id: 'log_' + Date.now(),
            timestamp: Date.now(),
            serverId: config.id,
            serverName: config.name,
            direction: 'outgoing',
            method: 'initialize',
            payload: { protocolVersion: '2024-11-05', capabilities: { tools: {}, resources: {}, prompts: {} } }
          })

          emitConsole({
            id: 'con_' + Date.now(),
            timestamp: Date.now(),
            serverId: config.id,
            serverName: config.name,
            stream: 'stdout',
            message: `[MCP Studio Engine] Spawned process: ${config.command} ${(config.args || []).join(' ')}`
          })

          const demoTools: McpTool[] = [
            {
              name: 'query_database',
              description: 'Executes a safe read-only SQL query against the sample database and returns rows.',
              inputSchema: {
                type: 'object',
                properties: {
                  sql: { type: 'string', description: 'The SELECT SQL query string to run' },
                  maxRows: { type: 'number', description: 'Maximum number of records to return' }
                },
                required: ['sql']
              }
            },
            {
              name: 'analyze_security',
              description: 'Performs static AST security auditing on a code snippet or configuration file.',
              inputSchema: {
                type: 'object',
                properties: {
                  sourceCode: { type: 'string', description: 'The code content to audit for security vulnerabilities' },
                  severityLevel: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], description: 'Minimum severity threshold' }
                },
                required: ['sourceCode']
              }
            },
            {
              name: 'calculate_metrics',
              description: 'Calculates performance metrics, latency p99, and token optimization scores.',
              inputSchema: {
                type: 'object',
                properties: {
                  datasetId: { type: 'string', description: 'Identifier of the benchmark dataset' }
                },
                required: ['datasetId']
              }
            }
          ]

          return {
            success: true,
            tools: demoTools,
            resources: [
              {
                uri: 'file:///system/config.json',
                name: 'System Configuration',
                mimeType: 'application/json',
                description: 'Global system configuration parameters and security limits.'
              }
            ],
            prompts: [
              {
                name: 'summarize_diagnostics',
                description: 'Analyzes recent server logs and produces a structured health report.',
                arguments: [
                  { name: 'serviceName', description: 'Name of the service to inspect', required: true }
                ]
              }
            ]
          }
        },

        disconnectServer: async (_serverId: string) => true,

        callTool: async (serverId: string, serverName: string, toolName: string, args: Record<string, any>) => {
          const startTime = Date.now()

          emitTraffic({
            id: 'log_' + Date.now(),
            timestamp: Date.now(),
            serverId,
            serverName,
            direction: 'outgoing',
            method: 'tools/call',
            payload: { name: toolName, arguments: args }
          })

          await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 40) + 20))
          const durationMs = Date.now() - startTime

          let resultPayload: Record<string, unknown>
          if (toolName === 'query_database') {
            resultPayload = {
              rows: [
                { id: 1, username: 'alexander', role: 'admin', email: 'support@mtlglabs.space', status: 'active', createdAt: '2026-08-30' },
                { id: 2, username: 'elena_dev', role: 'engineer', email: 'elena@mtlglabs.space', status: 'active', createdAt: '2026-08-31' },
                { id: 3, username: 'victor_ai', role: 'researcher', email: 'victor@mtlglabs.space', status: 'active', createdAt: '2026-08-31' }
              ],
              rowCount: 3,
              queryTimeMs: durationMs
            }
          } else if (toolName === 'analyze_security') {
            resultPayload = {
              status: 'AUDIT_PASSED',
              vulnerabilitiesFound: 0,
              score: 98,
              checksRun: ['SQL_INJECTION', 'XSS_FILTER', 'AUTH_BYPASS', 'SECRET_LEAKAGE']
            }
          } else {
            resultPayload = {
              status: 'OK',
              executedTool: toolName,
              receivedArguments: args,
              timestamp: new Date().toISOString()
            }
          }

          emitTraffic({
            id: 'log_' + Date.now(),
            timestamp: Date.now(),
            serverId,
            serverName,
            direction: 'incoming',
            method: 'tools/call',
            durationMs,
            payload: { content: [{ type: 'text', text: JSON.stringify(resultPayload) }] }
          })

          emitConsole({
            id: 'con_' + Date.now(),
            timestamp: Date.now(),
            serverId,
            serverName,
            stream: 'stdout',
            message: `[MCP Studio Engine] Successfully executed tool "${toolName}" in ${durationMs}ms`
          })

          return {
            success: true,
            result: resultPayload,
            durationMs
          }
        },

        readResource: async (_serverId: string, uri: string) => {
          return {
            success: true,
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify({ version: '1.0.0', environment: 'production', cluster: 'us-east-1' }, null, 2)
              }
            ]
          }
        },

        getPrompt: async (_serverId: string, promptName: string, args?: Record<string, string>) => {
          return {
            success: true,
            messages: [
              {
                role: 'user',
                content: `Please inspect service health for "${args?.serviceName || 'core-engine'}". Analyze recent exceptions and provide performance recommendations.`
              }
            ]
          }
        },

        discoverServers: async () => [
          {
            source: 'Claude Desktop',
            servers: [
              { name: 'PostgreSQL Database', transport: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-postgres'] }
            ]
          }
        ],

        simulateAgent: async (config: SimulationConfig, tools: McpTool[]) => {
          const firstTool = tools[0]
          const targetUrl = config.baseUrl || 'http://localhost:11434/api/chat'

          if (config.provider === 'ollama' || config.baseUrl?.includes('11434')) {
            try {
              const timeoutSec =
                config.timeoutSeconds !== undefined
                  ? config.timeoutSeconds === 0
                    ? 0
                    : config.timeoutSeconds
                  : 900
              const controller = new AbortController()
              const timeoutId = timeoutSec > 0 ? setTimeout(() => controller.abort(), timeoutSec * 1000) : null

              const toolDescriptions = tools
                .map((t) => `- ${t.name}: ${t.description || 'No description'}`)
                .join('\n')

              const sysPrompt =
                (config.systemPrompt || 'You are a helpful AI assistant with access to MCP tools.') +
                `\n\nAvailable local tools:\n${toolDescriptions}\n\nIf needed, describe your action clearly.`

              const ollamaModel = config.model && config.model !== 'llama3.2' ? config.model : 'llama3:8b'

              const reqHeaders: Record<string, string> = { 'Content-Type': 'application/json' }
              if (config.apiKey) {
                reqHeaders['Authorization'] = `Bearer ${config.apiKey}`
              }
              if (config.customHeaders) {
                Object.assign(reqHeaders, config.customHeaders)
              }

              const response = await fetch(targetUrl, {
                method: 'POST',
                headers: reqHeaders,
                signal: controller.signal,
                body: JSON.stringify({
                  model: ollamaModel,
                  messages: [
                    { role: 'system', content: sysPrompt },
                    { role: 'user', content: config.prompt }
                  ],
                  stream: false,
                  options: {
                    temperature: config.temperature || 0.2
                  }
                })
              })

              if (timeoutId) clearTimeout(timeoutId)

              if (response.ok) {
                const data = await response.json()
                const replyText = data.message?.content || 'Model execution completed.'

                // Detect if the model outputted a JSON tool call
                let detectedToolCall: { name: string; args: any } | null = null
                try {
                  const candidates: any[] = []
                  let depth = 0
                  let start = -1
                  for (let i = 0; i < replyText.length; i++) {
                    if (replyText[i] === '{') {
                      if (depth === 0) start = i
                      depth++
                    } else if (replyText[i] === '}') {
                      depth--
                      if (depth === 0 && start !== -1) {
                        try {
                          candidates.push(JSON.parse(replyText.substring(start, i + 1)))
                        } catch {}
                        start = -1
                      }
                    }
                  }
                  const toolNames = new Set(tools.map((t) => t.name))
                  for (const c of candidates) {
                    if (c && typeof c === 'object' && c.name && toolNames.has(c.name)) {
                      detectedToolCall = { name: c.name, args: c.arguments || c.args || {} }
                      break
                    }
                  }
                } catch {}

                const outMessages: SimulationMessage[] = [
                  { role: 'user', content: config.prompt }
                ]

                if (detectedToolCall) {
                  const toolDurMs = Math.round((data.total_duration || 350000000) / 1000000)
                  const toolResObj = {
                    status: 'SUCCESS',
                    url: detectedToolCall.args.url || 'https://example.com',
                    pageTitle: 'Example Domain',
                    contentLoaded: true
                  }

                  emitTraffic({
                    id: 'log_' + Date.now() + '_sim_req',
                    timestamp: Date.now() - toolDurMs,
                    serverId: config.serverId || 'puppeteer',
                    serverName: 'puppeteer',
                    direction: 'outgoing',
                    method: 'tools/call',
                    payload: { name: detectedToolCall.name, arguments: detectedToolCall.args }
                  })

                  emitTraffic({
                    id: 'log_' + Date.now() + '_sim_res',
                    timestamp: Date.now(),
                    serverId: config.serverId || 'puppeteer',
                    serverName: 'puppeteer',
                    direction: 'incoming',
                    method: 'tools/call',
                    durationMs: toolDurMs,
                    payload: { content: [{ type: 'text', text: JSON.stringify(toolResObj) }] }
                  })

                  outMessages.push({
                    role: 'assistant',
                    content: `Invoking tool: ${detectedToolCall.name}`,
                    toolCall: {
                      name: detectedToolCall.name,
                      args: detectedToolCall.args,
                      result: toolResObj,
                      durationMs: toolDurMs
                    }
                  })
                  outMessages.push({
                    role: 'assistant',
                    content: `Successfully navigated to ${detectedToolCall.args.url || 'the requested URL'}. The page has been loaded and inspected.`
                  })
                } else {
                  outMessages.push({
                    role: 'assistant',
                    content: replyText
                  })
                }

                return {
                  success: true,
                  messages: outMessages
                }
              }
            } catch (err) {
              console.warn('Ollama offline fetch failed or CORS restricted, using native local simulation:', err)
            }
          }

          // Fallback simulation
          await new Promise((r) => setTimeout(r, 600))
          const targetToolName = firstTool?.name || 'puppeteer_navigate'
          const targetArgs = targetToolName === 'puppeteer_navigate' ? { url: 'https://example.com' } : { query: 'test' }
          const targetDuration = 38
          const targetResult = { records: 5, status: 'HEALTHY', provider: config.provider || 'ollama/llama3:8b' }

          emitTraffic({
            id: 'log_' + Date.now() + '_sim_req',
            timestamp: Date.now() - targetDuration,
            serverId: config.serverId || 'puppeteer',
            serverName: 'puppeteer',
            direction: 'outgoing',
            method: 'tools/call',
            payload: { name: targetToolName, arguments: targetArgs }
          })

          emitTraffic({
            id: 'log_' + Date.now() + '_sim_res',
            timestamp: Date.now(),
            serverId: config.serverId || 'puppeteer',
            serverName: 'puppeteer',
            direction: 'incoming',
            method: 'tools/call',
            durationMs: targetDuration,
            payload: { content: [{ type: 'text', text: JSON.stringify(targetResult) }] }
          })

          return {
            success: true,
            messages: [
              { role: 'user', content: config.prompt },
              {
                role: 'assistant',
                content: `[Ollama: llama3:8b] I have analyzed the schema and will execute ${targetToolName} locally to fulfill your request.`,
                toolCall: {
                  name: targetToolName,
                  args: targetArgs,
                  result: targetResult,
                  durationMs: targetDuration
                }
              },
              {
                role: 'assistant',
                content: `Output from local MCP tool ${targetToolName} confirmed: All metrics are within operational bounds.`
              }
            ]
          }
        },

        onTrafficLog: (callback: (log: JsonRpcLog) => void) => {
          trafficListeners.push(callback)
          return () => {
            trafficListeners = trafficListeners.filter((fn) => fn !== callback)
          }
        },

        onConsoleLog: (callback: (log: ProcessConsoleLog) => void) => {
          consoleListeners.push(callback)
          return () => {
            consoleListeners = consoleListeners.filter((fn) => fn !== callback)
          }
        },

        onServerStatusChange: (_callback: any) => () => {}
      },

      storage: {
        getCollections: async () => getStored<RequestCollection[]>('collections', []),
        getStandaloneRequests: async () => getStored<SavedRequest[]>('standalone_requests', []),
        saveRequest: async (req: SavedRequest) => {
          const list = getStored<SavedRequest[]>('standalone_requests', [])
          const existing = list.findIndex((r) => r.id === req.id)
          if (existing >= 0) list[existing] = req
          else list.unshift(req)
          setStored('standalone_requests', list)
          return true
        },
        deleteRequest: async (reqId: string) => {
          const list = getStored<SavedRequest[]>('standalone_requests', [])
          setStored('standalone_requests', list.filter((r) => r.id !== reqId))
          return true
        },
        createCollection: async (name: string, description?: string) => {
          const cols = getStored<RequestCollection[]>('collections', [])
          const newCol: RequestCollection = {
            id: 'col_' + Date.now(),
            name,
            description,
            requests: [],
            createdAt: Date.now()
          }
          cols.push(newCol)
          setStored('collections', cols)
          return newCol
        },
        deleteCollection: async (colId: string) => {
          const cols = getStored<RequestCollection[]>('collections', [])
          setStored('collections', cols.filter((c) => c.id !== colId))
          return true
        },
        getHistory: async (limit?: number) => {
          const hist = getStored<ToolExecutionHistory[]>('history', [])
          return limit ? hist.slice(0, limit) : hist
        },
        clearHistory: async () => {
          setStored('history', [])
          return true
        },
        getEnvironments: async () => getStored<EnvironmentProfile[]>('environments', []),
        getActiveEnvironment: async () => {
          const list = getStored<EnvironmentProfile[]>('environments', [])
          return list.find((e) => e.isDefault) || list[0]
        },
        setActiveEnvironment: async (envId: string) => {
          const list = getStored<EnvironmentProfile[]>('environments', [])
          list.forEach((e) => { e.isDefault = (e.id === envId) })
          setStored('environments', list)
          return true
        },
        saveEnvironment: async (env: EnvironmentProfile) => {
          const list = getStored<EnvironmentProfile[]>('environments', [])
          const idx = list.findIndex((e) => e.id === env.id)
          if (idx >= 0) list[idx] = env
          else list.push(env)
          setStored('environments', list)
          return true
        },
        deleteEnvironment: async (envId: string) => {
          const list = getStored<EnvironmentProfile[]>('environments', [])
          setStored('environments', list.filter((e) => e.id !== envId))
          return true
        },
        getTestSuites: async () => getStored<TestSuite[]>('test_suites', []),
        saveTestSuite: async (suite: TestSuite) => {
          const list = getStored<TestSuite[]>('test_suites', [])
          const idx = list.findIndex((s) => s.id === suite.id)
          if (idx >= 0) list[idx] = suite
          else list.push(suite)
          setStored('test_suites', list)
          return suite
        },
        deleteTestSuite: async (suiteId: string) => {
          const list = getStored<TestSuite[]>('test_suites', [])
          setStored('test_suites', list.filter((s) => s.id !== suiteId))
          return true
        },
        getMockServers: async () => getStored<MockServerConfig[]>('mock_servers', []),
        saveMockServer: async (mock: MockServerConfig) => {
          const list = getStored<MockServerConfig[]>('mock_servers', [])
          const idx = list.findIndex((m) => m.id === mock.id)
          if (idx >= 0) list[idx] = mock
          else list.push(mock)
          setStored('mock_servers', list)
          return mock
        },
        deleteMockServer: async (mockId: string) => {
          const list = getStored<MockServerConfig[]>('mock_servers', [])
          setStored('mock_servers', list.filter((m) => m.id !== mockId))
          return true
        }
      },

      license: {
        getStatus: async (): Promise<LicenseStatus> => {
          const stored = localStorage.getItem('mcp_studio_mock_license')
          if (stored) {
            try {
              return JSON.parse(stored)
            } catch {}
          }
          return { isPro: false, tier: 'free', maxServers: 1 }
        },
        activate: async (_key: string, _email: string): Promise<{ success: boolean; message: string }> => {
          return {
            success: false,
            message: 'License activation is managed securely in the MCP Studio desktop application.'
          }
        },
        deactivate: async () => {
          localStorage.removeItem('mcp_studio_mock_license')
        }
      },

      dialog: {
        openDirectory: async () => null,
        openFile: async () => null
      },

      shell: {
        openExternal: async (_url: string) => {}
      },

      updater: {
        checkForUpdates: async (): Promise<UpdateInfoPayload> => {
          try {
            const res = await fetch('https://api.github.com/repos/alexandrmotologa/mcp-studio/releases/latest')
            if (res.ok) {
              const release = (await res.json()) as any
              const latestTag = String(release.tag_name || '').replace(/^v/, '')
              if (latestTag && latestTag !== STUDIO_VERSION) {
                return {
                  status: 'available',
                  version: latestTag,
                  releaseDate: release.published_at,
                  releaseNotes: release.body
                }
              }
            }
          } catch {}
          return { status: 'not-available', version: STUDIO_VERSION }
        },
        quitAndInstall: async () => {},
        getStatus: async () => ({ status: 'not-available', version: STUDIO_VERSION }),
        onUpdateStatus: (_cb: any) => () => {}
      },

      app: {
        getVersion: async () => STUDIO_VERSION,
        getInfo: async () => ({
          version: STUDIO_VERSION,
          name: 'mcp-studio-core',
          electron: '34.0.0',
          chrome: '132.0.0',
          node: '20.18.0',
          platform: 'web',
          arch: 'x64'
        })
      }
    }
  }
}
