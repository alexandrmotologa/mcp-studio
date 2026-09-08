import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

vi.mock('electron', () => {
  const dir = path.join(__dirname, 'tmp_storage_userdata')
  return {
    app: {
      getPath: vi.fn().mockReturnValue(dir)
    },
    safeStorage: {
      isEncryptionAvailable: vi.fn().mockReturnValue(true),
      encryptString: vi.fn().mockImplementation((str: string) => Buffer.from(str, 'utf8')),
      decryptString: vi.fn().mockImplementation((buf: Buffer) => buf.toString('utf8'))
    }
  }
})

import { StorageManager } from '../src/main/storage/StorageManager'

describe('StorageManager Unit Tests', () => {
  const tmpBaseDir = path.join(__dirname, 'tmp_storage_userdata')
  const tmpDir = path.join(tmpBaseDir, 'mcp-studio')
  const storageFile = path.join(tmpDir, 'storage.json')
  const backupFile = path.join(tmpDir, 'storage.json.bak')
  const tempFile = path.join(tmpDir, 'storage.json.tmp')

  beforeEach(() => {
    if (fs.existsSync(storageFile)) fs.unlinkSync(storageFile)
    if (fs.existsSync(backupFile)) fs.unlinkSync(backupFile)
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile)
  })

  afterAll(() => {
    if (fs.existsSync(tmpBaseDir)) {
      fs.rmSync(tmpBaseDir, { recursive: true, force: true })
    }
  })

  it('should initialize with default Development environment', () => {
    const storage = new StorageManager()
    const envs = storage.getEnvironments()

    expect(envs.length).toBeGreaterThanOrEqual(1)
    const devEnv = envs.find((e) => e.name === 'Development')
    expect(devEnv).toBeDefined()
    expect(devEnv?.variables.some((v) => v.key === 'API_BASE')).toBe(true)
  })

  it('should accurately resolve {{VARIABLE}} templates across primitives, objects, and arrays', () => {
    const storage = new StorageManager()
    storage.saveEnvironment({
      id: 'env-test',
      name: 'Test Env',
      variables: [
        { key: 'API_KEY', value: 'secret-xyz-777', enabled: true },
        { key: 'PORT', value: '8080', enabled: true },
        { key: 'DISABLED_VAR', value: 'should-not-replace', enabled: false }
      ]
    })
    storage.setActiveEnvironment('env-test')

    // 1. Primitive string
    expect(storage.resolveVariables('Bearer {{API_KEY}}')).toBe('Bearer secret-xyz-777')
    expect(storage.resolveVariables('http://localhost:{{PORT}}/api')).toBe('http://localhost:8080/api')
    expect(storage.resolveVariables('{{DISABLED_VAR}}')).toBe('{{DISABLED_VAR}}')

    // 2. Nested Object & Array
    const inputPayload = {
      auth: 'Bearer {{API_KEY}}',
      endpoints: ['http://api:{{PORT}}/v1', 'http://api:{{PORT}}/v2'],
      nested: {
        headerKey: '{{API_KEY}}',
        staticNum: 42
      }
    }

    const resolved = storage.resolveVariables(inputPayload)
    expect(resolved.auth).toBe('Bearer secret-xyz-777')
    expect(resolved.endpoints[0]).toBe('http://api:8080/v1')
    expect(resolved.nested.headerKey).toBe('secret-xyz-777')
    expect(resolved.nested.staticNum).toBe(42)
  })

  it('should record, retrieve and trim execution history entries', () => {
    const storage = new StorageManager()
    storage.clearHistory()

    storage.addHistoryEntry({
      id: 'h1',
      serverId: 's1',
      serverName: 'Postgres DB',
      toolName: 'query_db',
      arguments: { query: 'SELECT 1' },
      durationMs: 15,
      success: true,
      timestamp: Date.now()
    })

    const history = storage.getHistory()
    expect(history.length).toBe(1)
    expect(history[0].toolName).toBe('query_db')
    expect(history[0].success).toBe(true)
  })

  it('should handle Collections and Saved Requests CRUD', () => {
    const storage = new StorageManager()

    // Create collection
    const col = storage.createCollection('API Tests', 'Collection for testing APIs')
    expect(col.name).toBe('API Tests')
    expect(storage.getCollections().some((c) => c.id === col.id)).toBe(true)

    // Save request into collection
    storage.saveRequest({
      id: 'req-1',
      collectionId: col.id,
      name: 'Fetch User',
      serverId: 'srv-1',
      toolName: 'get_user',
      arguments: { id: 42 },
      createdAt: Date.now(),
      updatedAt: Date.now()
    })

    const updatedCol = storage.getCollections().find((c) => c.id === col.id)
    expect(updatedCol?.requests.length).toBe(1)
    expect(updatedCol?.requests[0].toolName).toBe('get_user')

    // Delete request
    storage.deleteRequest('req-1', col.id)
    const afterDeleteCol = storage.getCollections().find((c) => c.id === col.id)
    expect(afterDeleteCol?.requests.length).toBe(0)

    // Delete collection
    storage.deleteCollection(col.id)
    expect(storage.getCollections().some((c) => c.id === col.id)).toBe(false)
  })

  it('should handle Test Suites and Mock Servers CRUD', () => {
    const storage = new StorageManager()

    const suite = storage.saveTestSuite({
      id: 'suite-1',
      name: 'Auth Regression',
      serverId: 'srv-auth',
      cases: []
    })
    expect(storage.getTestSuites().length).toBe(1)

    storage.deleteTestSuite(suite.id)
    expect(storage.getTestSuites().length).toBe(0)

    const mock = storage.saveMockServer({
      id: 'mock-1',
      name: 'Simulated CRM',
      tools: []
    })
    expect(storage.getMockServers().length).toBe(1)

    storage.deleteMockServer(mock.id)
    expect(storage.getMockServers().length).toBe(0)
  })

  it('should atomically write storage and create backup file on save', () => {
    const storage = new StorageManager()
    storage.createCollection('Atomic Test', 'Testing atomic write')

    expect(fs.existsSync(storageFile)).toBe(true)
    expect(fs.existsSync(backupFile)).toBe(true)
    // .tmp file should NOT be left over
    expect(fs.existsSync(tempFile)).toBe(false)

    const content = fs.readFileSync(storageFile, 'utf8')
    expect(content.length).toBeGreaterThan(0)
  })

  it('should automatically recover from backup if storage.json is corrupted or empty', () => {
    const storage = new StorageManager()
    storage.createCollection('Recovery Test', 'Testing disaster recovery')
    expect(fs.existsSync(backupFile)).toBe(true)

    // Corrupt the primary storage.json file (e.g. truncated / 0 bytes or bad JSON)
    fs.writeFileSync(storageFile, '', 'utf8')

    // Create a new instance: should recover seamlessly from .bak
    const recoveredStorage = new StorageManager()
    const cols = recoveredStorage.getCollections()
    expect(cols.some((c) => c.name === 'Recovery Test')).toBe(true)
  })

  it('should return defensive copies preventing mutation of internal state', () => {
    const storage = new StorageManager()
    const col = storage.createCollection('Immutable Col', 'Testing defensive copy')

    const cols = storage.getCollections()
    // Mutate the returned array
    cols[0].name = 'Hacked Col Name'
    cols.pop()

    // Internal state should remain unmutated
    const freshCols = storage.getCollections()
    expect(freshCols.length).toBe(1)
    expect(freshCols[0].name).toBe('Immutable Col')
  })

  it('should truncate oversized history payloads exceeding 64KB and cap history at 500', () => {
    const storage = new StorageManager()
    const hugePayload = 'A'.repeat(70000)

    storage.addHistoryEntry({
      id: 'huge_h',
      serverId: 's1',
      serverName: 'Big DB',
      toolName: 'dump_data',
      arguments: { data: hugePayload },
      result: { content: hugePayload },
      durationMs: 120,
      success: true,
      timestamp: Date.now()
    })

    const history = storage.getHistory()
    expect(history.length).toBe(1)
    const entry = history[0]
    expect((entry.result as any)?._truncated).toBe(true)
    expect((entry.arguments as any)?._truncated).toBe(true)
    expect((entry.result as any)?.preview).toContain('Truncated: exceeded 64KB history limit')
  })
})
