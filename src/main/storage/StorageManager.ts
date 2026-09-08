import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { app, safeStorage } from 'electron'
import {
  RequestCollection,
  SavedRequest,
  ToolExecutionHistory,
  EnvironmentProfile,
  TestSuite,
  MockServerConfig
} from '../../shared/types'

interface StorageSchema {
  collections: RequestCollection[]
  standaloneRequests: SavedRequest[]
  history: ToolExecutionHistory[]
  environments: EnvironmentProfile[]
  activeEnvironmentId?: string
  testSuites: TestSuite[]
  mockServers: MockServerConfig[]
}

export class StorageManager {
  private filePath: string
  private tempPath: string
  private backupPath: string
  private data: StorageSchema = {
    collections: [],
    standaloneRequests: [],
    history: [],
    environments: [
      {
        id: 'env-default',
        name: 'Development',
        isDefault: true,
        variables: [
          { key: 'API_BASE', value: 'http://localhost:8000', enabled: true },
          { key: 'DB_PORT', value: '5432', enabled: true }
        ]
      }
    ],
    activeEnvironmentId: 'env-default',
    testSuites: [],
    mockServers: []
  }

  private saveTimeout: NodeJS.Timeout | null = null

  constructor() {
    const userDataPath = app?.getPath?.('userData') || process.cwd()
    const dir = path.join(userDataPath, 'mcp-studio')
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true })
      } catch (err) {
        console.warn('Could not create directory for storage:', err)
      }
    }
    this.filePath = path.join(dir, 'storage.json')
    this.tempPath = path.join(dir, 'storage.json.tmp')
    this.backupPath = path.join(dir, 'storage.json.bak')
    this.load()
  }

  private isEncryptionAvailable(): boolean {
    try {
      return (
        typeof safeStorage !== 'undefined' &&
        safeStorage !== null &&
        typeof safeStorage.isEncryptionAvailable === 'function' &&
        safeStorage.isEncryptionAvailable()
      )
    } catch {
      return false
    }
  }

  private load(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const fileBuffer = fs.readFileSync(this.filePath)
        if (fileBuffer.length === 0) {
          throw new Error('storage.json file is empty (0 bytes)')
        }
        let jsonStr = ''

        if (this.isEncryptionAvailable()) {
          try {
            jsonStr = safeStorage.decryptString(fileBuffer)
          } catch {
            // Graceful fallback: legacy or development plaintext migration
            jsonStr = fileBuffer.toString('utf8')
          }
        } else {
          jsonStr = fileBuffer.toString('utf8')
        }

        const parsed = JSON.parse(jsonStr)
        this.data = {
          ...this.data,
          ...parsed,
          testSuites: parsed.testSuites || [],
          mockServers: parsed.mockServers || []
        }

        // Maintain backup copy of valid data
        try {
          fs.copyFileSync(this.filePath, this.backupPath)
        } catch {}
      } else {
        if (fs.existsSync(this.backupPath)) {
          this.tryRecoverFromBackup()
        } else {
          this.save()
        }
      }
    } catch (err) {
      console.error('Failed to load storage.json, attempting recovery from backup:', err)
      const recovered = this.tryRecoverFromBackup()
      if (!recovered) {
        this.save()
      }
    }
  }

  private tryRecoverFromBackup(): boolean {
    try {
      if (fs.existsSync(this.backupPath)) {
        console.warn('Attempting to recover corrupted storage from backup:', this.backupPath)
        const fileBuffer = fs.readFileSync(this.backupPath)
        if (fileBuffer.length === 0) return false

        let jsonStr = ''
        if (this.isEncryptionAvailable()) {
          try {
            jsonStr = safeStorage.decryptString(fileBuffer)
          } catch {
            jsonStr = fileBuffer.toString('utf8')
          }
        } else {
          jsonStr = fileBuffer.toString('utf8')
        }

        const parsed = JSON.parse(jsonStr)
        this.data = {
          ...this.data,
          ...parsed,
          testSuites: parsed.testSuites || [],
          mockServers: parsed.mockServers || []
        }
        this.save()
        console.info('Successfully recovered storage from backup.')
        return true
      }
    } catch (backupErr) {
      console.error('Failed to recover storage from backup:', backupErr)
    }
    return false
  }

  public flush(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
      this.saveTimeout = null
    }
    this.save()
  }

  private saveDebounced(delayMs = 400): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
    }
    this.saveTimeout = setTimeout(() => {
      this.saveTimeout = null
      this.save()
    }, delayMs)
  }

  private save(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
      this.saveTimeout = null
    }
    try {
      const jsonStr = JSON.stringify(this.data, null, 2)
      if (this.isEncryptionAvailable()) {
        const encryptedBuffer = safeStorage.encryptString(jsonStr)
        fs.writeFileSync(this.tempPath, encryptedBuffer)
      } else {
        fs.writeFileSync(this.tempPath, jsonStr, 'utf8')
      }

      // Atomic file replacement
      try {
        fs.renameSync(this.tempPath, this.filePath)
      } catch {
        fs.copyFileSync(this.tempPath, this.filePath)
        try {
          fs.unlinkSync(this.tempPath)
        } catch {}
      }

      // Refresh backup on disk
      try {
        fs.copyFileSync(this.filePath, this.backupPath)
      } catch {}
    } catch (err) {
      console.error('Failed to write storage.json atomically:', err)
    }
  }

  // Collections & Requests (defensive copies returned)
  public getCollections(): RequestCollection[] {
    return this.data.collections.map((c) => ({
      ...c,
      requests: c.requests ? c.requests.map((r) => ({ ...r })) : []
    }))
  }

  public getStandaloneRequests(): SavedRequest[] {
    return this.data.standaloneRequests.map((r) => ({ ...r }))
  }

  public saveRequest(request: SavedRequest): SavedRequest {
    if (request.collectionId) {
      const col = this.data.collections.find((c) => c.id === request.collectionId)
      if (col) {
        const existingIdx = col.requests.findIndex((r) => r.id === request.id)
        if (existingIdx >= 0) {
          col.requests[existingIdx] = request
        } else {
          col.requests.push(request)
        }
      }
    } else {
      const existingIdx = this.data.standaloneRequests.findIndex((r) => r.id === request.id)
      if (existingIdx >= 0) {
        this.data.standaloneRequests[existingIdx] = request
      } else {
        this.data.standaloneRequests.push(request)
      }
    }
    this.save()
    return request
  }

  public deleteRequest(requestId: string, collectionId?: string): boolean {
    if (collectionId) {
      const col = this.data.collections.find((c) => c.id === collectionId)
      if (col) {
        col.requests = col.requests.filter((r) => r.id !== requestId)
        this.save()
        return true
      }
    } else {
      this.data.standaloneRequests = this.data.standaloneRequests.filter((r) => r.id !== requestId)
      this.save()
      return true
    }
    return false
  }

  public createCollection(name: string, description?: string): RequestCollection {
    const newCol: RequestCollection = {
      id: 'col_' + randomUUID(),
      name,
      description,
      requests: [],
      createdAt: Date.now()
    }
    this.data.collections.push(newCol)
    this.save()
    return newCol
  }

  public deleteCollection(collectionId: string): boolean {
    const lenBefore = this.data.collections.length
    this.data.collections = this.data.collections.filter((c) => c.id !== collectionId)
    if (this.data.collections.length !== lenBefore) {
      this.save()
      return true
    }
    return false
  }

  // History (capped at 500 items, max 64KB per payload to prevent unbounded storage bloat)
  public getHistory(limit?: number): ToolExecutionHistory[] {
    const list = limit && limit > 0 ? this.data.history.slice(0, limit) : this.data.history
    return list.map((item) => ({
      ...item,
      arguments: item.arguments ? { ...item.arguments } : {}
    }))
  }

  private sanitizeHistoryEntry(entry: ToolExecutionHistory): ToolExecutionHistory {
    const copy = { ...entry }
    const MAX_PAYLOAD_CHARS = 65536 // 64 KB limit

    if (copy.result !== undefined && copy.result !== null) {
      try {
        const str = typeof copy.result === 'string' ? copy.result : JSON.stringify(copy.result)
        if (str.length > MAX_PAYLOAD_CHARS) {
          copy.result = {
            _truncated: true,
            preview: str.slice(0, 1024) + '... [Truncated: exceeded 64KB history limit]',
            byteSize: str.length
          }
        }
      } catch {
        // Keep as is if JSON stringify fails
      }
    }

    if (copy.arguments) {
      try {
        const str = JSON.stringify(copy.arguments)
        if (str.length > MAX_PAYLOAD_CHARS) {
          copy.arguments = {
            _truncated: true,
            preview: str.slice(0, 1024) + '... [Truncated: exceeded 64KB history limit]'
          }
        }
      } catch {}
    }

    return copy
  }

  public addHistory(entry: ToolExecutionHistory): void {
    const sanitized = this.sanitizeHistoryEntry(entry)
    this.data.history.unshift(sanitized)
    if (this.data.history.length > 500) {
      this.data.history = this.data.history.slice(0, 500)
    }
    this.saveDebounced(400)
  }

  public addHistoryEntry(entry: ToolExecutionHistory): void {
    this.addHistory(entry)
  }

  public clearHistory(): boolean {
    this.data.history = []
    this.save()
    return true
  }

  // Environment Profiles & Variables (defensive copies returned)
  public getEnvironments(): EnvironmentProfile[] {
    return this.data.environments.map((e) => ({
      ...e,
      variables: e.variables ? e.variables.map((v) => ({ ...v })) : []
    }))
  }

  public getActiveEnvironment(): EnvironmentProfile | undefined {
    const env =
      this.data.environments.find((e) => e.id === this.data.activeEnvironmentId) ||
      this.data.environments[0]
    return env
      ? { ...env, variables: env.variables ? env.variables.map((v) => ({ ...v })) : [] }
      : undefined
  }

  public setActiveEnvironment(envId: string): boolean {
    const found = this.data.environments.some((e) => e.id === envId)
    if (found) {
      this.data.activeEnvironmentId = envId
      this.save()
      return true
    }
    return false
  }

  public saveEnvironment(env: EnvironmentProfile): EnvironmentProfile {
    const idx = this.data.environments.findIndex((e) => e.id === env.id)
    if (idx >= 0) {
      this.data.environments[idx] = env
    } else {
      this.data.environments.push(env)
    }
    this.save()
    return env
  }

  public deleteEnvironment(envId: string): boolean {
    if (this.data.environments.length <= 1) return false // Keep at least 1
    this.data.environments = this.data.environments.filter((e) => e.id !== envId)
    if (this.data.activeEnvironmentId === envId) {
      this.data.activeEnvironmentId = this.data.environments[0]?.id
    }
    this.save()
    return true
  }

  // Variable Resolver ({{VARIABLE_NAME}} replacement)
  public resolveVariables(input: any): any {
    const activeEnv = this.getActiveEnvironment()
    if (!activeEnv || !activeEnv.variables || activeEnv.variables.length === 0) {
      return input
    }

    const varMap: Record<string, string> = {}
    for (const v of activeEnv.variables) {
      if (v.enabled) {
        varMap[v.key] = v.value
      }
    }

    const replaceInString = (str: string): string => {
      return str.replace(/\{\{([a-zA-Z0-9_-]+)\}\}/g, (_, key) => {
        return varMap[key] !== undefined ? varMap[key] : `{{${key}}}`
      })
    }

    const deepReplace = (item: any): any => {
      if (typeof item === 'string') {
        return replaceInString(item)
      }
      if (Array.isArray(item)) {
        return item.map(deepReplace)
      }
      if (item !== null && typeof item === 'object') {
        const out: Record<string, any> = {}
        for (const [k, v] of Object.entries(item)) {
          out[k] = deepReplace(v)
        }
        return out
      }
      return item
    }

    return deepReplace(input)
  }

  // Phase 7: Test Suites (defensive copies returned)
  public getTestSuites(): TestSuite[] {
    return (this.data.testSuites || []).map((s) => ({
      ...s,
      testCases: s.testCases ? s.testCases.map((tc) => ({ ...tc })) : []
    }))
  }

  public saveTestSuite(suite: TestSuite): TestSuite {
    if (!this.data.testSuites) this.data.testSuites = []
    const idx = this.data.testSuites.findIndex((s) => s.id === suite.id)
    if (idx >= 0) {
      this.data.testSuites[idx] = suite
    } else {
      this.data.testSuites.push(suite)
    }
    this.save()
    return suite
  }

  public deleteTestSuite(suiteId: string): boolean {
    if (!this.data.testSuites) return false
    const before = this.data.testSuites.length
    this.data.testSuites = this.data.testSuites.filter((s) => s.id !== suiteId)
    if (this.data.testSuites.length !== before) {
      this.save()
      return true
    }
    return false
  }

  // Phase 7: Mock Servers (defensive copies returned)
  public getMockServers(): MockServerConfig[] {
    return (this.data.mockServers || []).map((m) => ({
      ...m,
      tools: m.tools ? m.tools.map((t) => ({ ...t })) : []
    }))
  }

  public saveMockServer(server: MockServerConfig): MockServerConfig {
    if (!this.data.mockServers) this.data.mockServers = []
    const idx = this.data.mockServers.findIndex((s) => s.id === server.id)
    if (idx >= 0) {
      this.data.mockServers[idx] = server
    } else {
      this.data.mockServers.push(server)
    }
    this.save()
    return server
  }

  public deleteMockServer(mockId: string): boolean {
    if (!this.data.mockServers) return false
    const before = this.data.mockServers.length
    this.data.mockServers = this.data.mockServers.filter((s) => s.id !== mockId)
    if (this.data.mockServers.length !== before) {
      this.save()
      return true
    }
    return false
  }
}
