import { ipcMain } from 'electron'
import { UpdaterManager } from '../ee/updater/UpdaterManager'

export interface UpdaterHandlerContext {
  getUpdaterManager: () => UpdaterManager | null
}

export function registerUpdaterHandlers(ctx: UpdaterHandlerContext): void {
  ipcMain.handle('updater:check-for-updates', async () => {
    return await ctx.getUpdaterManager()?.checkForUpdates()
  })

  ipcMain.handle('updater:quit-and-install', async () => {
    ctx.getUpdaterManager()?.quitAndInstall()
  })

  ipcMain.handle('updater:get-status', async () => {
    return ctx.getUpdaterManager()?.getStatus() || { status: 'idle' }
  })
}
