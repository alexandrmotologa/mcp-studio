import { BrowserWindow } from 'electron'
import { McpClientManager } from '../mcp/McpClientManager'
import { StorageManager } from '../storage/StorageManager'
import { LicenseManager } from '../ee/license/LicenseManager'
import { UpdaterManager } from '../ee/updater/UpdaterManager'
import { McpSimulator } from '../ee/simulator/McpSimulator'
import { registerMcpHandlers } from './mcpHandlers'
import { registerStorageHandlers } from './storageHandlers'
import { registerSystemHandlers } from './systemHandlers'
import { registerEeIpc } from '../ee/ipc/registerEeIpc'

export interface IpcServices {
  getMcpManager: () => McpClientManager | null
  getStorageManager: () => StorageManager | null
  getLicenseManager: () => LicenseManager | null
  getUpdaterManager: () => UpdaterManager | null
  getSimulator: () => McpSimulator | null
  getMainWindow: () => BrowserWindow | null
}

export function registerAllIpcHandlers(services: IpcServices): void {
  registerMcpHandlers({
    getMcpManager: services.getMcpManager,
    getStorageManager: services.getStorageManager,
    getLicenseManager: services.getLicenseManager
  })

  registerStorageHandlers({
    getStorageManager: services.getStorageManager
  })

  registerSystemHandlers({
    getMainWindow: services.getMainWindow
  })

  // Enterprise Edition IPC handlers (License, Auto-Updater, Multi-LLM Simulation)
  registerEeIpc({
    getLicenseManager: services.getLicenseManager,
    getUpdaterManager: services.getUpdaterManager,
    getSimulator: services.getSimulator
  })
}

export * from './validation'
