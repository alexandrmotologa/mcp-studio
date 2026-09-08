import { ipcMain } from 'electron'
import { LicenseManager } from '../license/LicenseManager'
import { UpdaterManager } from '../updater/UpdaterManager'
import { McpSimulator } from '../simulator/McpSimulator'
import { isValidString, isValidEmail } from '../../ipc/validation'
import { SimulationConfig, McpTool } from '../../../shared/types'

export interface EeIpcServices {
  getLicenseManager: () => LicenseManager | null
  getUpdaterManager: () => UpdaterManager | null
  getSimulator: () => McpSimulator | null
}

export function registerEeIpc(services: EeIpcServices): void {
  // Community Open Source Edition: Stubs with safe validation
  ipcMain.handle('license:get-status', async () => {
    return services.getLicenseManager()?.getStatus() || { isPro: false, tier: 'free', maxServers: 1 }
  })

  ipcMain.handle('license:activate', async (_, key: string, email: string) => {
    const licenseManager = services.getLicenseManager()
    if (!licenseManager) return { success: false, message: 'License manager is not initialized' }
    if (!isValidString(key, 24)) return { success: false, message: 'Invalid license key format' }
    if (!isValidEmail(email, 100)) {
      return { success: false, message: 'A valid customer email is required to activate your license.' }
    }
    return await licenseManager.activate(key, email)
  })

  ipcMain.handle('license:deactivate', async () => {
    return await services.getLicenseManager()?.deactivate()
  })

  ipcMain.handle('updater:check-for-updates', async () => {
    return await services.getUpdaterManager()?.checkForUpdates()
  })

  ipcMain.handle('updater:quit-and-install', async () => {
    services.getUpdaterManager()?.quitAndInstall()
  })

  ipcMain.handle('updater:get-status', async () => {
    return services.getUpdaterManager()?.getStatus() || { status: 'idle' }
  })

  ipcMain.handle('mcp:simulate-agent', async (_, config: SimulationConfig, tools: McpTool[]) => {
    const simulator = services.getSimulator()
    if (!simulator) return { success: false, error: 'Simulation engine is not initialized' }
    if (!config || !isValidString(config.prompt)) {
      return { success: false, error: 'Invalid simulation config prompt' }
    }
    return await simulator.runSimulation(config, tools || [])
  })
}
