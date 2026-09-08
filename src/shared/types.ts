export type ServerStatus = 'connected' | 'connecting' | 'disconnected' | 'error'
export type ServerTransport = 'stdio' | 'sse'

export interface McpServerBaseConfig {
  id: string
  name: string
  status: ServerStatus
  error?: string
  autoConnect?: boolean
  isMock?: boolean
  createdAt: number
}

export interface McpStdioServerConfig extends McpServerBaseConfig {
  transport: 'stdio'
  command: string
  args?: string[]
  env?: Record<string, string>
  cwd?: string
  url?: undefined
  headers?: undefined
}

export interface McpSseServerConfig extends McpServerBaseConfig {
  transport: 'sse'
  url: string
  headers?: Record<string, string>
  command?: undefined
  args?: undefined
  env?: undefined
  cwd?: undefined
}

export type McpServerConfig = McpStdioServerConfig | McpSseServerConfig
export type McpServerInput =
  | Omit<McpStdioServerConfig, 'id' | 'status' | 'createdAt'>
  | Omit<McpSseServerConfig, 'id' | 'status' | 'createdAt'>

export interface McpToolProperty {
  type?: string
  description?: string
  enum?: string[]
  default?: unknown
  [key: string]: unknown
}

export interface McpToolInputSchema {
  type: string
  properties?: Record<string, McpToolProperty>
  required?: string[]
  [key: string]: unknown
}

export interface McpTool {
  name: string
  description?: string
  inputSchema: McpToolInputSchema
}

export interface McpResource {
  uri: string
  name: string
  description?: string
  mimeType?: string
}

export interface McpResourceContent {
  uri: string
  mimeType?: string
  text?: string
  blob?: string
}

export interface McpPrompt {
  name: string
  description?: string
  arguments?: {
    name: string
    description?: string
    required?: boolean
  }[]
}

export interface JsonRpcLog {
  id: string
  serverId: string
  serverName: string
  timestamp: number
  direction: 'incoming' | 'outgoing'
  method?: string
  payload: unknown
  durationMs?: number
  isError?: boolean
}

export interface ProcessConsoleLog {
  id: string
  serverId: string
  serverName: string
  stream: 'stdout' | 'stderr'
  message: string
  timestamp: number
}

export interface SavedRequest {
  id: string
  name: string
  serverId: string
  serverName: string
  toolName: string
  arguments: Record<string, unknown>
  collectionId?: string
  createdAt: number
  updatedAt: number
}

export interface RequestCollection {
  id: string
  name: string
  description?: string
  requests: SavedRequest[]
  createdAt: number
}

export interface ToolExecutionHistory {
  id: string
  serverId: string
  serverName: string
  toolName: string
  arguments: Record<string, unknown>
  result?: unknown
  error?: string
  durationMs: number
  success: boolean
  timestamp: number
}

export interface EnvironmentVariable {
  key: string
  value: string
  enabled: boolean
  isSecret?: boolean
}

export interface EnvironmentProfile {
  id: string
  name: string
  variables: EnvironmentVariable[]
  isDefault?: boolean
}

// Re-export Enterprise Edition types for backward compatibility in Core
export * from './eeTypes'
