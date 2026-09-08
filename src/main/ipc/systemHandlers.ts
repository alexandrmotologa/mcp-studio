import { ipcMain, dialog, shell, app, BrowserWindow } from 'electron'

export interface SystemHandlerContext {
  getMainWindow: () => BrowserWindow | null
}

export function registerSystemHandlers(ctx: SystemHandlerContext): void {
  ipcMain.handle('dialog:open-directory', async () => {
    const mainWindow = ctx.getMainWindow()
    if (!mainWindow) return null
    const res = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    })
    return res.filePaths[0] || null
  })

  ipcMain.handle('dialog:open-file', async () => {
    const mainWindow = ctx.getMainWindow()
    if (!mainWindow) return null
    const res = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile']
    })
    return res.filePaths[0] || null
  })

  ipcMain.handle('shell:open-external', async (_, url: string) => {
    try {
      const parsed = new URL(url)
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        await shell.openExternal(url)
      } else {
        console.warn(`[Security] Blocked shell.openExternal with disallowed protocol: ${parsed.protocol}`)
      }
    } catch (err) {
      console.error('[Security] Invalid URL for shell.openExternal:', err)
    }
  })

  ipcMain.handle('app:get-version', async () => {
    return app.getVersion()
  })

  ipcMain.handle('app:get-info', async () => {
    return {
      version: app.getVersion(),
      name: app.getName(),
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      node: process.versions.node,
      platform: process.platform,
      arch: process.arch
    }
  })
}
