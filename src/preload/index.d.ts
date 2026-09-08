import {
  McpServerConfig,
  McpTool,
  McpResource,
  McpResourceContent,
  McpPrompt,
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
} from '../shared/types'

export interface IElectronAPI {
  mcp: {
    connectServer: (config: McpServerConfig) => Promise<{
      success: boolean
      error?: string
      tools?: McpTool[]
      resources?: McpResource[]
      prompts?: McpPrompt[]
    }>
    disconnectServer: (serverId: string) => Promise<boolean>
    callTool: (
      serverId: string,
      serverName: string,
      toolName: string,
      args: Record<string, unknown>
    ) => Promise<{
      success: boolean
      result?: unknown
      durationMs?: number
      error?: string
    }>
    readResource: (
      serverId: string,
      uri: string
    ) => Promise<{
      success: boolean
      contents?: McpResourceContent[]
      error?: string
    }>
    getPrompt: (
      serverId: string,
      promptName: string,
      args?: Record<string, string>
    ) => Promise<{
      success: boolean
      messages?: unknown[]
      description?: string
      error?: string
    }>
    discoverServers: () => Promise<
      {
        source: string
        servers: Omit<McpServerConfig, 'id' | 'status' | 'createdAt'>[]
      }[]
    >
    simulateAgent: (
      config: SimulationConfig,
      tools: McpTool[]
    ) => Promise<{
      success: boolean
      messages: SimulationMessage[]
      error?: string
    }>
    onTrafficLog: (callback: (log: JsonRpcLog) => void) => () => void
    onConsoleLog: (callback: (log: ProcessConsoleLog) => void) => () => void
    onServerStatusChange: (
      callback: (data: {
        serverId: string
        status: 'connected' | 'connecting' | 'disconnected' | 'error'
        error?: string
        metadata?: { tools: McpTool[]; resources: McpResource[]; prompts: McpPrompt[] }
      }) => void
    ) => () => void
  }
  storage: {
    getCollections: () => Promise<RequestCollection[]>
    getStandaloneRequests: () => Promise<SavedRequest[]>
    saveRequest: (request: SavedRequest) => Promise<SavedRequest | null | boolean>
    deleteRequest: (requestId: string, collectionId?: string) => Promise<boolean>
    createCollection: (name: string, description?: string) => Promise<RequestCollection | null>
    deleteCollection: (collectionId: string) => Promise<boolean>
    getHistory: (limit?: number) => Promise<ToolExecutionHistory[]>
    clearHistory: () => Promise<boolean>
    getEnvironments: () => Promise<EnvironmentProfile[]>
    getActiveEnvironment: () => Promise<EnvironmentProfile | undefined>
    setActiveEnvironment: (envId: string) => Promise<boolean>
    saveEnvironment: (env: EnvironmentProfile) => Promise<EnvironmentProfile | null | boolean>
    deleteEnvironment: (envId: string) => Promise<boolean>

    // Test Suites
    getTestSuites: () => Promise<TestSuite[]>
    saveTestSuite: (suite: TestSuite) => Promise<TestSuite | null>
    deleteTestSuite: (suiteId: string) => Promise<boolean>

    // Mock Servers
    getMockServers: () => Promise<MockServerConfig[]>
    saveMockServer: (mock: MockServerConfig) => Promise<MockServerConfig | null>
    deleteMockServer: (mockId: string) => Promise<boolean>
  }
  license: {
    getStatus: () => Promise<LicenseStatus>
    activate: (key: string, email: string) => Promise<{ success: boolean; message: string }>
    deactivate: () => Promise<void>
    onStatusChange?: (callback: (status: LicenseStatus) => void) => () => void
  }
  dialog: {
    openDirectory: () => Promise<string | null>
    openFile: () => Promise<string | null>
  }
  shell: {
    openExternal: (url: string) => Promise<void>
  }
  updater: {
    checkForUpdates: () => Promise<UpdateInfoPayload>
    quitAndInstall: () => Promise<void>
    getStatus: () => Promise<UpdateInfoPayload>
    onUpdateStatus: (callback: (status: UpdateInfoPayload) => void) => () => void
  }
  app?: {
    getVersion: () => Promise<string>
    getInfo?: () => Promise<{
      version: string
      name: string
      electron: string
      chrome: string
      node: string
      platform: string
      arch: string
    }>
  }
}

declare global {
  interface Window {
    api: IElectronAPI
  }
}
