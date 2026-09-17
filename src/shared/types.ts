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
  requestTokens?: JsonRpcTokenStats
  responseTokens?: JsonRpcTokenStats
  payloadBytes?: number
}

// 1. Client Sync & Write-Back Models
export type ClientSyncTargetId =
  | 'antigravity'
  | 'claude-desktop'
  | 'cursor'
  | 'windsurf'
  | 'zed'
  | 'cline'
  | 'roo-code'
  | 'continue'

export interface ClientSyncTarget {
  id: ClientSyncTargetId
  name: string
  configFilePath: string
  exists: boolean
  isWritable: boolean
  installedServerCount: number
  format: 'claude_mcpServers' | 'cursor_mcpServers' | 'zed_contextServers' | 'antigravity_mcpServers'
}

export interface ClientSyncDiff {
  targetId: ClientSyncTargetId
  targetName: string
  configFilePath: string
  serversToAdd: string[]
  serversToUpdate: string[]
  serversUnchanged: string[]
  beforeJson: string
  afterJson: string
}

export interface ClientSyncResult {
  success: boolean
  targetId: ClientSyncTargetId
  backupFilePath?: string
  modifiedFilePath: string
  syncedServerCount: number
  error?: string
}

// 2. Traffic Analytics & Token Metrics
export interface JsonRpcTokenStats {
  estimatedTokens: number
  charCount: number
  byteSize: number
}

// Extend existing JsonRpcLog interface
export interface JsonRpcLogExtended extends JsonRpcLog {
  requestTokens?: JsonRpcTokenStats
  responseTokens?: JsonRpcTokenStats
  payloadBytes: number
}

export interface TrafficAggregateMetrics {
  totalCalls: number
  errorCount: number
  avgDurationMs: number
  p50DurationMs: number
  p95DurationMs: number
  p99DurationMs: number
  totalBytesTransferred: number
  totalEstimatedTokens: number
  callsByServer: Record<string, number>
  callsByMethod: Record<string, number>
}

// 3. Contract & Regression Test Runner Models
export type ContractAssertionType =
  | 'status_success'
  | 'duration_lt'
  | 'schema_valid'
  | 'json_path_equals'
  | 'contains_text'
  | 'regex_match'

export interface ContractAssertion {
  id: string
  type: ContractAssertionType
  path?: string // e.g. "content[0].text"
  expectedValue?: any
  toleranceMs?: number
}

export interface ContractTestCase {
  id: string
  name: string
  toolName: string
  arguments: Record<string, any>
  assertions: ContractAssertion[]
  expectedLatencyMs?: number
  enabled: boolean
}

export interface ContractTestSuite {
  id: string
  serverId: string
  serverName: string
  name: string
  description?: string
  testCases: ContractTestCase[]
  createdAt: number
  updatedAt: number
}

export interface ContractAssertionResult {
  assertion: ContractAssertion
  passed: boolean
  actualValue?: any
  message?: string
}

export interface ContractTestCaseResult {
  testCaseId: string
  testCaseName: string
  toolName: string
  status: 'passed' | 'failed' | 'skipped' | 'error'
  durationMs: number
  assertionResults: ContractAssertionResult[]
  rawResponse?: any
  error?: string
}

export interface ContractTestReport {
  id: string
  suiteId: string
  suiteName: string
  timestamp: number
  totalTests: number
  passedCount: number
  failedCount: number
  avgDurationMs: number
  results: ContractTestCaseResult[]
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
