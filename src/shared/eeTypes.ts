// Community Open Source Edition: Clean Type Stubs
export type LicenseTier = 'free' | 'pro' | 'team'

export interface LicenseStatus {
  isPro: boolean
  tier: LicenseTier
  maxServers: number
  licenseKey?: string
  customerEmail?: string
  activatedAt?: number
}

export type SimulationProvider = string

export interface SimulationMessage {
  role: string
  content: string
  toolCall?: any
}

export interface SimulationConfig {
  provider: SimulationProvider
  model: string
  prompt: string
  serverId: string
  [key: string]: any
}

export interface TestSuite {
  id: string
  name: string
  description?: string
  testCases: any[]
  createdAt: number
  updatedAt: number
}

export interface MockServerConfig {
  id: string
  name: string
  tools: any[]
  createdAt: number
}

export interface SchemaLintIssue {
  severity: 'error' | 'warning' | 'info'
  path: string
  message: string
  suggestion?: string
}

export interface SchemaLintResult {
  toolName: string
  score: number
  tokenEstimate: number
  issues: SchemaLintIssue[]
}

export type UpdateStatus = 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'

export interface UpdateInfoPayload {
  status: UpdateStatus
  version?: string
  releaseDate?: string
  releaseNotes?: string
  percent?: number
  transferred?: number
  total?: number
  bytesPerSecond?: number
  error?: string
}
