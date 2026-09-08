import { ipcMain } from 'electron'
import { LicenseManager } from '../ee/license/LicenseManager'
import { isValidString, isValidEmail } from './validation'

export interface LicenseHandlerContext {
  getLicenseManager: () => LicenseManager | null
}

export function registerLicenseHandlers(ctx: LicenseHandlerContext): void {
  ipcMain.handle('license:get-status', async () => {
    return ctx.getLicenseManager()?.getStatus() || { isPro: false, tier: 'free', maxServers: 1 }
  })

  ipcMain.handle('license:activate', async (_, key: string, email: string) => {
    const licenseManager = ctx.getLicenseManager()
    if (!licenseManager) return { success: false, message: 'License manager is not initialized' }
    if (!isValidString(key, 24)) return { success: false, message: 'Invalid license key format' }
    if (!isValidEmail(email, 100)) {
      return { success: false, message: 'A valid customer email is required to activate your license.' }
    }
    return await licenseManager.activate(key, email)
  })

  ipcMain.handle('license:deactivate', async () => {
    return await ctx.getLicenseManager()?.deactivate()
  })
}
