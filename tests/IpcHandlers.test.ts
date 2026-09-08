import { describe, it, expect, vi, beforeEach } from 'vitest'

const handlers: Record<string, Function> = {}

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel: string, handler: Function) => {
      if (handlers[channel]) {
        throw new Error(`Attempted to register a second handler for '${channel}'`)
      }
      handlers[channel] = handler
    })
  },
  dialog: {
    showOpenDialog: vi.fn()
  },
  shell: {
    openExternal: vi.fn()
  },
  app: {
    getVersion: vi.fn().mockReturnValue('2.0.3'),
    getName: vi.fn().mockReturnValue('MCP Studio Core')
  }
}))

import { isValidString, isPlainObject } from '../src/main/ipc/validation'
import { registerAllIpcHandlers } from '../src/main/ipc/index'

describe('IPC Validation & Handlers Unit Tests', () => {
  beforeEach(() => {
    for (const key of Object.keys(handlers)) {
      delete handlers[key]
    }
  })

  describe('Validation Helpers', () => {
    it('should validate non-empty strings correctly within maxLen', () => {
      expect(isValidString('valid string')).toBe(true)
      expect(isValidString('')).toBe(false)
      expect(isValidString('   ')).toBe(false)
      expect(isValidString(null)).toBe(false)
      expect(isValidString(undefined)).toBe(false)
      expect(isValidString(123)).toBe(false)
      expect(isValidString('tool', 3)).toBe(false) // exceeds maxLen of 3
      expect(isValidString('tool', 4)).toBe(true)
    })

    it('should validate plain objects and reject primitives or arrays', () => {
      expect(isPlainObject({ id: '1', name: 'Test' })).toBe(true)
      expect(isPlainObject({})).toBe(true)
      expect(isPlainObject([])).toBe(false)
      expect(isPlainObject(null)).toBe(false)
      expect(isPlainObject('string')).toBe(false)
      expect(isPlainObject(123)).toBe(false)
    })
  })

  describe('Storage IPC Channel Registration & Defensive Guards', () => {
    it('should reject malformed save-request payloads without calling storage manager', async () => {
      const mockStorageManager = {
        saveRequest: vi.fn().mockReturnValue({ id: 'req_1', name: 'Valid' })
      }

      registerAllIpcHandlers({
        getMcpManager: () => null,
        getStorageManager: () => mockStorageManager as any,
        getLicenseManager: () => null,
        getUpdaterManager: () => null,
        getSimulator: () => null,
        getMainWindow: () => null
      })

      expect(handlers['storage:save-request']).toBeDefined()

      // Missing name
      const res1 = await handlers['storage:save-request'](null, { id: 'req_1' })
      expect(res1).toBeNull()
      expect(mockStorageManager.saveRequest).not.toHaveBeenCalled()

      // Non-object payload
      const res2 = await handlers['storage:save-request'](null, 'invalid')
      expect(res2).toBeNull()
      expect(mockStorageManager.saveRequest).not.toHaveBeenCalled()

      // Valid payload
      const validPayload = { id: 'req_1', name: 'My Request' }
      const res3 = await handlers['storage:save-request'](null, validPayload)
      expect(res3).toEqual({ id: 'req_1', name: 'Valid' })
      expect(mockStorageManager.saveRequest).toHaveBeenCalledWith(validPayload)
    })

    it('should safely reject invalid requestId on delete-request', async () => {
      const mockStorageManager = {
        deleteRequest: vi.fn().mockReturnValue(true)
      }

      registerAllIpcHandlers({
        getMcpManager: () => null,
        getStorageManager: () => mockStorageManager as any,
        getLicenseManager: () => null,
        getUpdaterManager: () => null,
        getSimulator: () => null,
        getMainWindow: () => null
      })

      const res = await handlers['storage:delete-request'](null, '')
      expect(res).toBe(false)
      expect(mockStorageManager.deleteRequest).not.toHaveBeenCalled()
    })
  })

  describe('License & Updater IPC Channels', () => {
    it('should return default free tier status if license manager is uninitialized', async () => {
      registerAllIpcHandlers({
        getMcpManager: () => null,
        getStorageManager: () => null,
        getLicenseManager: () => null,
        getUpdaterManager: () => null,
        getSimulator: () => null,
        getMainWindow: () => null
      })

      expect(handlers['license:get-status']).toBeDefined()
      const status = await handlers['license:get-status']()
      expect(status).toEqual({ isPro: false, tier: 'free', maxServers: 1 })
    })

    it('should reject invalid license keys on activate without crashing', async () => {
      const mockLicenseManager = {
        activate: vi.fn()
      }

      registerAllIpcHandlers({
        getMcpManager: () => null,
        getStorageManager: () => null,
        getLicenseManager: () => mockLicenseManager as any,
        getUpdaterManager: () => null,
        getSimulator: () => null,
        getMainWindow: () => null
      })

      const res = await handlers['license:activate'](null, '')
      expect(res).toEqual({ success: false, message: 'Invalid license key format' })
      expect(mockLicenseManager.activate).not.toHaveBeenCalled()
    })

    it('should reject keys exceeding max length of 24 characters', async () => {
      const mockLicenseManager = {
        activate: vi.fn()
      }

      registerAllIpcHandlers({
        getMcpManager: () => null,
        getStorageManager: () => null,
        getLicenseManager: () => mockLicenseManager as any,
        getUpdaterManager: () => null,
        getSimulator: () => null,
        getMainWindow: () => null
      })

      const res = await handlers['license:activate'](null, 'MCP-PRO-1234-1234-1234-TOO-LONG', 'user@example.com')
      expect(res).toEqual({ success: false, message: 'Invalid license key format' })
      expect(mockLicenseManager.activate).not.toHaveBeenCalled()
    })

    it('should reject activate when email is invalid or missing in IPC', async () => {
      const mockLicenseManager = {
        activate: vi.fn()
      }

      registerAllIpcHandlers({
        getMcpManager: () => null,
        getStorageManager: () => null,
        getLicenseManager: () => mockLicenseManager as any,
        getUpdaterManager: () => null,
        getSimulator: () => null,
        getMainWindow: () => null
      })

      const res = await handlers['license:activate'](null, 'MCP-PRO-A1B2-C3D4-E5F6', '')
      expect(res).toEqual({ success: false, message: 'A valid customer email is required to activate your license.' })
      expect(mockLicenseManager.activate).not.toHaveBeenCalled()
    })
  })

  describe('MCP Connect Server License Limit Guard', () => {
    it('should reject connecting a second server for Free tier when limit (1) is reached', async () => {
      const mockMcpManager = {
        isServerConnected: vi.fn().mockReturnValue(false),
        getConnectedServerCount: vi.fn().mockReturnValue(1),
        connectServer: vi.fn()
      }
      const mockLicenseManager = {
        getStatus: vi.fn().mockReturnValue({
          isPro: false,
          tier: 'free',
          maxServers: 1
        })
      }

      registerAllIpcHandlers({
        getMcpManager: () => mockMcpManager as any,
        getStorageManager: () => null,
        getLicenseManager: () => mockLicenseManager as any,
        getUpdaterManager: () => null,
        getSimulator: () => null,
        getMainWindow: () => null
      })

      expect(handlers['mcp:connect-server']).toBeDefined()

      const res = await handlers['mcp:connect-server'](null, {
        id: 'srv_second',
        name: 'Second Server',
        transport: 'stdio',
        command: 'node'
      })

      expect(res.success).toBe(false)
      expect(res.error).toContain('Community Edition limit exceeded')
      expect(mockMcpManager.connectServer).not.toHaveBeenCalled()
    })

    it('should allow connecting multiple servers when user is on Pro tier', async () => {
      const mockMcpManager = {
        isServerConnected: vi.fn().mockReturnValue(false),
        getConnectedServerCount: vi.fn().mockReturnValue(3),
        connectServer: vi.fn().mockResolvedValue({ success: true, tools: [] })
      }
      const mockLicenseManager = {
        getStatus: vi.fn().mockReturnValue({
          isPro: true,
          tier: 'pro',
          maxServers: 100
        })
      }

      registerAllIpcHandlers({
        getMcpManager: () => mockMcpManager as any,
        getStorageManager: () => null,
        getLicenseManager: () => mockLicenseManager as any,
        getUpdaterManager: () => null,
        getSimulator: () => null,
        getMainWindow: () => null
      })

      const res = await handlers['mcp:connect-server'](null, {
        id: 'srv_fourth',
        name: 'Fourth Server',
        transport: 'stdio',
        command: 'node'
      })

      expect(res.success).toBe(true)
      expect(mockMcpManager.connectServer).toHaveBeenCalled()
    })

    it('should allow reconnecting an already connected server even if count is at limit', async () => {
      const mockMcpManager = {
        isServerConnected: vi.fn().mockReturnValue(true),
        getConnectedServerCount: vi.fn().mockReturnValue(1),
        connectServer: vi.fn().mockResolvedValue({ success: true, tools: [] })
      }
      const mockLicenseManager = {
        getStatus: vi.fn().mockReturnValue({
          isPro: false,
          tier: 'free',
          maxServers: 1
        })
      }

      registerAllIpcHandlers({
        getMcpManager: () => mockMcpManager as any,
        getStorageManager: () => null,
        getLicenseManager: () => mockLicenseManager as any,
        getUpdaterManager: () => null,
        getSimulator: () => null,
        getMainWindow: () => null
      })

      const res = await handlers['mcp:connect-server'](null, {
        id: 'srv_existing',
        name: 'Existing Connected Server',
        transport: 'stdio',
        command: 'node'
      })

      expect(res.success).toBe(true)
      expect(mockMcpManager.connectServer).toHaveBeenCalled()
    })
  })
})
