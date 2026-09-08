import { contextBridge, ipcRenderer } from 'electron'
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

const api = {
  mcp: {
    connectServer: (config: McpServerConfig): Promise<{
      success: boolean
      error?: string
      tools?: McpTool[]
      resources?: McpResource[]
      prompts?: McpPrompt[]
    }> => ipcRenderer.invoke('mcp:connect-server', config),

    disconnectServer: (serverId: string): Promise<boolean> =>
      ipcRenderer.invoke('mcp:disconnect-server', serverId),

    callTool: (serverId: string, serverName: string, toolName: string, args: Record<string, unknown>): Promise<{
      success: boolean
      result?: unknown
      durationMs?: number
      error?: string
    }> => ipcRenderer.invoke('mcp:call-tool', serverId, serverName, toolName, args),

    readResource: (serverId: string, uri: string): Promise<{
      success: boolean
      contents?: McpResourceContent[]
      error?: string
    }> => ipcRenderer.invoke('mcp:read-resource', serverId, uri),

    getPrompt: (serverId: string, promptName: string, args?: Record<string, string>): Promise<{
      success: boolean
      messages?: any[]
      description?: string
      error?: string
    }> => ipcRenderer.invoke('mcp:get-prompt', serverId, promptName, args),

    discoverServers: (): Promise<{
      source: string
      servers: Omit<McpServerConfig, 'id' | 'status' | 'createdAt'>[]
    }[]> => ipcRenderer.invoke('mcp:discover-servers'),

    simulateAgent: (config: SimulationConfig, tools: McpTool[]): Promise<{
      success: boolean
      messages: SimulationMessage[]
      error?: string
    }> => ipcRenderer.invoke('mcp:simulate-agent', config, tools),

    onTrafficLog: (callback: (log: JsonRpcLog) => void) => {
      const handler = (_: any, log: JsonRpcLog) => callback(log)
      ipcRenderer.on('mcp:traffic-log', handler)
      return () => {
        ipcRenderer.removeListener('mcp:traffic-log', handler)
      }
    },

    onConsoleLog: (callback: (log: ProcessConsoleLog) => void) => {
      const handler = (_: any, log: ProcessConsoleLog) => callback(log)
      ipcRenderer.on('mcp:console-log', handler)
      return () => {
        ipcRenderer.removeListener('mcp:console-log', handler)
      }
    },

    onServerStatusChange: (
      callback: (data: {
        serverId: string
        status: 'connected' | 'connecting' | 'disconnected' | 'error'
        error?: string
        metadata?: { tools: McpTool[]; resources: McpResource[]; prompts: McpPrompt[] }
      }) => void
    ) => {
      const handler = (_: any, data: any) => callback(data)
      ipcRenderer.on('mcp:server-status', handler)
      return () => {
        ipcRenderer.removeListener('mcp:server-status', handler)
      }
    }
  },

  storage: {
    getCollections: (): Promise<RequestCollection[]> => ipcRenderer.invoke('storage:get-collections'),
    getStandaloneRequests: (): Promise<SavedRequest[]> => ipcRenderer.invoke('storage:get-standalone-requests'),
    saveRequest: (request: SavedRequest): Promise<SavedRequest | null> =>
      ipcRenderer.invoke('storage:save-request', request),
    deleteRequest: (requestId: string, collectionId?: string): Promise<boolean> =>
      ipcRenderer.invoke('storage:delete-request', requestId, collectionId),
    createCollection: (name: string, description?: string): Promise<RequestCollection | null> =>
      ipcRenderer.invoke('storage:create-collection', name, description),
    deleteCollection: (collectionId: string): Promise<boolean> =>
      ipcRenderer.invoke('storage:delete-collection', collectionId),
    getHistory: (limit?: number): Promise<ToolExecutionHistory[]> =>
      ipcRenderer.invoke('storage:get-history', limit),
    clearHistory: (): Promise<boolean> => ipcRenderer.invoke('storage:clear-history'),
    getEnvironments: (): Promise<EnvironmentProfile[]> => ipcRenderer.invoke('storage:get-environments'),
    getActiveEnvironment: (): Promise<EnvironmentProfile | undefined> =>
      ipcRenderer.invoke('storage:get-active-environment'),
    setActiveEnvironment: (envId: string): Promise<boolean> =>
      ipcRenderer.invoke('storage:set-active-environment', envId),
    saveEnvironment: (env: EnvironmentProfile): Promise<EnvironmentProfile | null> =>
      ipcRenderer.invoke('storage:save-environment', env),
    deleteEnvironment: (envId: string): Promise<boolean> =>
      ipcRenderer.invoke('storage:delete-environment', envId),

    // Test Suites
    getTestSuites: (): Promise<TestSuite[]> => ipcRenderer.invoke('storage:get-test-suites'),
    saveTestSuite: (suite: TestSuite): Promise<TestSuite | null> =>
      ipcRenderer.invoke('storage:save-test-suite', suite),
    deleteTestSuite: (suiteId: string): Promise<boolean> =>
      ipcRenderer.invoke('storage:delete-test-suite', suiteId),

    // Mock Servers
    getMockServers: (): Promise<MockServerConfig[]> => ipcRenderer.invoke('storage:get-mock-servers'),
    saveMockServer: (mock: MockServerConfig): Promise<MockServerConfig | null> =>
      ipcRenderer.invoke('storage:save-mock-server', mock),
    deleteMockServer: (mockId: string): Promise<boolean> =>
      ipcRenderer.invoke('storage:delete-mock-server', mockId)
  },

  license: {
    getStatus: (): Promise<LicenseStatus> => ipcRenderer.invoke('license:get-status'),
    activate: (key: string, email: string): Promise<{ success: boolean; message: string }> =>
      ipcRenderer.invoke('license:activate', key, email),
    deactivate: (): Promise<void> => ipcRenderer.invoke('license:deactivate'),
    onStatusChange: (callback: (status: LicenseStatus) => void) => {
      const handler = (_: unknown, status: LicenseStatus) => callback(status)
      ipcRenderer.on('license:status-changed', handler)
      return () => {
        ipcRenderer.removeListener('license:status-changed', handler)
      }
    }
  },

  dialog: {
    openDirectory: (): Promise<string | null> => ipcRenderer.invoke('dialog:open-directory'),
    openFile: (): Promise<string | null> => ipcRenderer.invoke('dialog:open-file')
  },

  shell: {
    openExternal: (url: string): Promise<void> => ipcRenderer.invoke('shell:open-external', url)
  },

  updater: {
    checkForUpdates: (): Promise<UpdateInfoPayload> => ipcRenderer.invoke('updater:check-for-updates'),
    quitAndInstall: (): Promise<void> => ipcRenderer.invoke('updater:quit-and-install'),
    getStatus: (): Promise<UpdateInfoPayload> => ipcRenderer.invoke('updater:get-status'),
    onUpdateStatus: (callback: (status: UpdateInfoPayload) => void) => {
      const handler = (_: unknown, status: UpdateInfoPayload) => callback(status)
      ipcRenderer.on('updater:status', handler)
      return () => {
        ipcRenderer.removeListener('updater:status', handler)
      }
    }
  },

  app: {
    getVersion: (): Promise<string> => ipcRenderer.invoke('app:get-version'),
    getInfo: (): Promise<{
      version: string
      name: string
      electron: string
      chrome: string
      node: string
      platform: string
      arch: string
    }> => ipcRenderer.invoke('app:get-info')
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error('[Preload] Failed to expose api via contextBridge:', error)
  }
} else {
  console.error('[Security Alert] Context isolation is not enabled. Refusing to expose API to window.')
}
