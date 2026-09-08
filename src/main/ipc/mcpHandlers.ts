import { ipcMain } from 'electron'
import { randomUUID } from 'crypto'
import { McpClientManager } from '../mcp/McpClientManager'
import { McpDiscovery } from '../mcp/McpDiscovery'
import { StorageManager } from '../storage/StorageManager'
import { McpServerConfig } from '../../shared/types'
import { isValidString } from './validation'

import { LicenseManager } from '../ee/license/LicenseManager'

export interface McpHandlerContext {
  getMcpManager: () => McpClientManager | null
  getStorageManager: () => StorageManager | null
  getLicenseManager?: () => LicenseManager | null
}

export function registerMcpHandlers(ctx: McpHandlerContext): void {
  ipcMain.handle('mcp:connect-server', async (_, config: McpServerConfig) => {
    const mcpManager = ctx.getMcpManager()
    if (!mcpManager) return { success: false, error: 'MCP Client Manager is not initialized' }
    if (!config || !isValidString(config.id) || !isValidString(config.name)) {
      return { success: false, error: 'Invalid server configuration payload' }
    }

    // License guard: Community Edition limit check
    const licenseManager = ctx.getLicenseManager ? ctx.getLicenseManager() : null
    const licenseStatus = licenseManager
      ? licenseManager.getStatus()
      : { isPro: false, tier: 'free' as const, maxServers: 1 }

    if (!licenseStatus.isPro) {
      const maxAllowed = licenseStatus.maxServers || 1
      const isAlreadyConnected = mcpManager.isServerConnected(config.id)
      const currentConnectedCount = mcpManager.getConnectedServerCount()

      if (!isAlreadyConnected && currentConnectedCount >= maxAllowed) {
        return {
          success: false,
          error: `Community Edition limit exceeded: maximum ${maxAllowed} active server allowed simultaneously. Upgrade to Pro for unlimited servers.`
        }
      }
    }

    return await mcpManager.connectServer(config)
  })

  ipcMain.handle('mcp:disconnect-server', async (_, serverId: string) => {
    const mcpManager = ctx.getMcpManager()
    if (!mcpManager) return { success: false, error: 'MCP Client Manager is not initialized' }
    if (!isValidString(serverId)) {
      return { success: false, error: 'Invalid serverId provided' }
    }
    return await mcpManager.disconnectServer(serverId)
  })

  ipcMain.handle(
    'mcp:call-tool',
    async (
      _,
      serverId: string,
      serverName: string,
      toolName: string,
      rawArgs: Record<string, any>
    ) => {
      const mcpManager = ctx.getMcpManager()
      if (!mcpManager) return { success: false, error: 'MCP Client Manager is not initialized' }
      if (!isValidString(serverId) || !isValidString(toolName)) {
        return { success: false, error: 'Invalid serverId or toolName parameter' }
      }
      const safeRawArgs = rawArgs && typeof rawArgs === 'object' ? rawArgs : {}

      const storageManager = ctx.getStorageManager()
      // Resolve {{VARIABLES}} from active environment
      const resolvedArgs = storageManager ? storageManager.resolveVariables(safeRawArgs) : safeRawArgs

      const startTime = Date.now()
      const res = await mcpManager.callTool(serverId, toolName, resolvedArgs)
      const durationMs = res?.durationMs || Date.now() - startTime

      // Record to History
      if (storageManager) {
        storageManager.addHistoryEntry({
          id: 'hist_' + randomUUID(),
          serverId,
          serverName: serverName || 'Unknown Server',
          toolName,
          arguments: safeRawArgs,
          result: res?.result,
          error: res?.error,
          durationMs,
          success: !!res?.success,
          timestamp: Date.now()
        })
      }

      return res
    }
  )

  ipcMain.handle('mcp:read-resource', async (_, serverId: string, uri: string) => {
    const mcpManager = ctx.getMcpManager()
    if (!mcpManager) return { success: false, error: 'MCP Client Manager is not initialized' }
    if (!isValidString(serverId) || !isValidString(uri, 5000)) {
      return { success: false, error: 'Invalid serverId or resource uri' }
    }
    return await mcpManager.readResource(serverId, uri)
  })

  ipcMain.handle(
    'mcp:get-prompt',
    async (_, serverId: string, promptName: string, args?: Record<string, string>) => {
      const mcpManager = ctx.getMcpManager()
      if (!mcpManager) return { success: false, error: 'MCP Client Manager is not initialized' }
      if (!isValidString(serverId) || !isValidString(promptName)) {
        return { success: false, error: 'Invalid serverId or promptName' }
      }
      return await mcpManager.getPrompt(serverId, promptName, args)
    }
  )

  ipcMain.handle('mcp:discover-servers', async () => {
    return await McpDiscovery.discoverInstalledServers()
  })
}
