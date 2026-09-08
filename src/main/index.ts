import { app, BrowserWindow, session, shell } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { McpClientManager } from './mcp/McpClientManager'
import { McpSimulator } from './ee/simulator/McpSimulator'
import { LicenseManager } from './ee/license/LicenseManager'
import { StorageManager } from './storage/StorageManager'
import { UpdaterManager } from './ee/updater/UpdaterManager'
import { registerAllIpcHandlers } from './ipc'

let mainWindow: BrowserWindow | null = null
let mcpManager: McpClientManager | null = null
let simulator: McpSimulator | null = null
let licenseManager: LicenseManager | null = null
let storageManager: StorageManager | null = null
let updaterManager: UpdaterManager | null = null

function createWindow(): void {
  const candidateIcon =
    process.platform === 'win32'
      ? join(__dirname, '../../build/icon.ico')
      : join(__dirname, '../../build/icon.png')
  const iconPath = existsSync(candidateIcon) ? candidateIcon : undefined

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#090a0f',
    title: 'MCP Studio',
    ...(iconPath ? { icon: iconPath } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mcpManager = new McpClientManager(mainWindow)
  simulator = new McpSimulator(mcpManager)
  licenseManager = new LicenseManager()
  storageManager = new StorageManager()
  updaterManager = new UpdaterManager(mainWindow)

  const cspHeader = is.dev
    ? "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:* https:; frame-src 'none'; object-src 'none';"
    : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:* https:; frame-src 'none'; object-src 'none';"

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [cspHeader]
      }
    })
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // Defensive fallback: ensure window is shown even if ready-to-show is delayed or skipped
  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      console.info('[Main] Enforcing window display via timeout fallback')
      mainWindow.show()
    }
  }, 2500)

  mainWindow.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
    console.error(`[Renderer] Failed to load index.html: ${errorCode} - ${errorDescription}`)
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    try {
      const parsed = new URL(details.url)
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        shell.openExternal(details.url)
      } else {
        console.warn(`[Security] Blocked popup with unsafe protocol: ${parsed.protocol}`)
      }
    } catch {
      // Ignore malformed URLs
    }
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// IPC Handlers
function setupIpcHandlers(): void {
  registerAllIpcHandlers({
    getMcpManager: () => mcpManager,
    getStorageManager: () => storageManager,
    getLicenseManager: () => licenseManager,
    getUpdaterManager: () => updaterManager,
    getSimulator: () => simulator,
    getMainWindow: () => mainWindow
  })
}

app.whenReady().then(() => {
  try {
    electronApp.setAppUserModelId('com.alexandrmotologa.mcpstudio')

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    setupIpcHandlers()
    createWindow()
  } catch (err) {
    console.error('[Main] Fatal initialization error in whenReady:', err)
  }

  // Silent background update check after 5 seconds
  setTimeout(() => {
    updaterManager?.checkForUpdates().catch((err) => {
      console.info('[AutoUpdater] Initial update check notice:', err?.message || err)
    })
  }, 5000)

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  updaterManager?.dispose()
  mcpManager?.disconnectAll()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
