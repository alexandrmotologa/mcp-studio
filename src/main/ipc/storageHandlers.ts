import { ipcMain } from 'electron'
import { StorageManager } from '../storage/StorageManager'
import {
  SavedRequest,
  EnvironmentProfile,
  TestSuite,
  MockServerConfig
} from '../../shared/types'
import { isValidString, isPlainObject } from './validation'

export interface StorageHandlerContext {
  getStorageManager: () => StorageManager | null
}

export function registerStorageHandlers(ctx: StorageHandlerContext): void {
  // Collections & Saved Requests
  ipcMain.handle('storage:get-collections', async () => {
    return ctx.getStorageManager()?.getCollections() || []
  })

  ipcMain.handle('storage:get-standalone-requests', async () => {
    return ctx.getStorageManager()?.getStandaloneRequests() || []
  })

  ipcMain.handle('storage:save-request', async (_, request: SavedRequest) => {
    if (!isPlainObject(request) || !isValidString(request.id) || !isValidString(request.name)) {
      return null
    }
    return ctx.getStorageManager()?.saveRequest(request) || null
  })

  ipcMain.handle('storage:delete-request', async (_, requestId: string, collectionId?: string) => {
    if (!isValidString(requestId)) return false
    if (collectionId !== undefined && !isValidString(collectionId)) return false
    return ctx.getStorageManager()?.deleteRequest(requestId, collectionId) ?? false
  })

  ipcMain.handle(
    'storage:create-collection',
    async (_, name: string, description?: string) => {
      if (!isValidString(name)) return null
      return ctx.getStorageManager()?.createCollection(name, description) || null
    }
  )

  ipcMain.handle('storage:delete-collection', async (_, collectionId: string) => {
    if (!isValidString(collectionId)) return false
    return ctx.getStorageManager()?.deleteCollection(collectionId) ?? false
  })

  // History
  ipcMain.handle('storage:get-history', async (_, limit?: number) => {
    const validLimit = typeof limit === 'number' && limit > 0 ? limit : undefined
    return ctx.getStorageManager()?.getHistory(validLimit) || []
  })

  ipcMain.handle('storage:clear-history', async () => {
    return ctx.getStorageManager()?.clearHistory() ?? true
  })

  // Environments
  ipcMain.handle('storage:get-environments', async () => {
    return ctx.getStorageManager()?.getEnvironments() || []
  })

  ipcMain.handle('storage:get-active-environment', async () => {
    return ctx.getStorageManager()?.getActiveEnvironment()
  })

  ipcMain.handle('storage:set-active-environment', async (_, envId: string) => {
    if (!isValidString(envId)) return false
    return ctx.getStorageManager()?.setActiveEnvironment(envId) ?? false
  })

  ipcMain.handle('storage:save-environment', async (_, env: EnvironmentProfile) => {
    if (!isPlainObject(env) || !isValidString(env.id) || !isValidString(env.name)) {
      return null
    }
    return ctx.getStorageManager()?.saveEnvironment(env) || null
  })

  ipcMain.handle('storage:delete-environment', async (_, envId: string) => {
    if (!isValidString(envId)) return false
    return ctx.getStorageManager()?.deleteEnvironment(envId) ?? false
  })

  // Test Suites
  ipcMain.handle('storage:get-test-suites', async () => {
    return ctx.getStorageManager()?.getTestSuites() || []
  })

  ipcMain.handle('storage:save-test-suite', async (_, suite: TestSuite) => {
    if (!isPlainObject(suite) || !isValidString(suite.id) || !isValidString(suite.name)) {
      return null
    }
    return ctx.getStorageManager()?.saveTestSuite(suite) || null
  })

  ipcMain.handle('storage:delete-test-suite', async (_, suiteId: string) => {
    if (!isValidString(suiteId)) return false
    return ctx.getStorageManager()?.deleteTestSuite(suiteId) ?? false
  })

  // Mock Servers
  ipcMain.handle('storage:get-mock-servers', async () => {
    return ctx.getStorageManager()?.getMockServers() || []
  })

  ipcMain.handle('storage:save-mock-server', async (_, mock: MockServerConfig) => {
    if (!isPlainObject(mock) || !isValidString(mock.id) || !isValidString(mock.name)) {
      return null
    }
    return ctx.getStorageManager()?.saveMockServer(mock) || null
  })

  ipcMain.handle('storage:delete-mock-server', async (_, mockId: string) => {
    if (!isValidString(mockId)) return false
    return ctx.getStorageManager()?.deleteMockServer(mockId) ?? false
  })
}
