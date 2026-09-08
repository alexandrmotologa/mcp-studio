import { useState, useEffect, Suspense, useCallback, useMemo } from 'react'
import { Header } from './components/Header'
import { ServerSidebar } from './components/ServerSidebar'
import { ToolInspector } from './components/ToolInspector'
import { ResourceViewer } from './components/ResourceViewer'
import { PromptTester } from './components/PromptTester'
import { TrafficInspector } from './components/TrafficInspector'
import { AddServerModal } from './components/AddServerModal'
import { EnvironmentModal } from './components/EnvironmentModal'
import { CollectionsDrawer } from './components/CollectionsDrawer'
import { ConsoleDrawer } from './components/ConsoleDrawer'
import { ServerTabsBar } from './components/ServerTabsBar'
import { CommandPalette } from './components/CommandPalette'
import { SettingsModal, SettingsTab } from './components/SettingsModal'
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal'
import { ServerLimitModal } from './components/ServerLimitModal'
import { ErrorBoundary } from './components/ErrorBoundary'
import { OnboardingModal, ONBOARDING_STORAGE_KEY } from './components/OnboardingModal'
import { playSuccessSound, playErrorSound } from './utils/soundEngine'

// Enterprise Edition Registry & Modals
import {
  isEeAvailable,
  CommunityUpsellCard,
  EeAiSimulator as AiSimulator,
  EeLicenseModal as LicenseModal,
  EeDeveloperToolkitModal as DeveloperToolkitModal,
  EeModelArenaModal as ModelArenaModal,
  EeServerHubModal as ServerHubModal,
  EeTestSuiteModal as TestSuiteModal,
  EeMockServerModal as MockServerModal,
  EeDocsExporterModal as DocsExporterModal,
  EeWorkspaceTransferModal as WorkspaceTransferModal,
  EeBenchmarkRunnerModal as BenchmarkRunnerModal,
  EeSecurityAuditorModal as SecurityAuditorModal,
  EeServerScaffolderModal as ServerScaffolderModal,
  EeWorkflowBuilderModal as WorkflowBuilderModal,
  EeSchemaDiffModal as SchemaDiffModal,
  EeShortcutsModal as ShortcutsModal,
  EeRemoteBridgeModal as RemoteBridgeModal,
  EeThemeSelectorModal as ThemeSelectorModal,
  EeOpenApiConverterModal as OpenApiConverterModal,
  EeProcessWatchdogModal as ProcessWatchdogModal,
  EeDockerPackagerModal as DockerPackagerModal,
  EeSessionRecorderModal as SessionRecorderModal,
  EeTrafficInterceptorModal as TrafficInterceptorModal,
  EeNotificationCenterModal as NotificationCenterModal,
  EeAutoDiscoverModal as AutoDiscoverModal,
  EeExportModal as ExportModal,
  EeAnalyticsDashboard as AnalyticsDashboard
} from './ee/eeRegistry'
import type {
  StudioNotification,
  NotificationActionType
} from './ee/eeRegistry'
import {
  dispatchNotification,
  NOTIFICATION_EVENT,
  NOTIFICATIONS_STORAGE_KEY
} from './utils/notificationDispatcher'
import {
  McpServerConfig,
  McpStdioServerConfig,
  McpSseServerConfig,
  McpServerInput,
  McpTool,
  McpResource,
  McpPrompt,
  JsonRpcLog,
  ProcessConsoleLog,
  LicenseStatus,
  EnvironmentProfile,
  SavedRequest,
  ToolExecutionHistory
} from '../../shared/types'

const STORAGE_KEY = 'mcp_studio_servers_v1'

export type ActiveModal =
  | 'addServer'
  | 'hub'
  | 'testSuite'
  | 'mock'
  | 'export'
  | 'docs'
  | 'commandPalette'
  | 'arena'
  | 'interceptor'
  | 'notification'
  | 'toolkit'
  | 'scaffolder'
  | 'workflow'
  | 'schemaDiff'
  | 'shortcuts'
  | 'remoteBridge'
  | 'theme'
  | 'openApi'
  | 'watchdog'
  | 'docker'
  | 'recorder'
  | 'benchmark'
  | 'security'
  | 'settings'
  | 'transfer'
  | 'license'
  | 'environment'
  | 'collections'
  | 'discover'
  | 'onboarding'
  | 'serverLimit'
  | null

export default function App() {
  const [servers, setServers] = useState<McpServerConfig[]>([])
  const [activeServerId, setActiveServerId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'tools' | 'resources' | 'prompts' | 'simulator' | 'traffic' | 'analytics'>('tools')
  const [trafficLogs, setTrafficLogs] = useState<JsonRpcLog[]>([])
  const [consoleLogs, setConsoleLogs] = useState<ProcessConsoleLog[]>([])
  const [license, setLicense] = useState<LicenseStatus>({
    isPro: false,
    tier: 'free',
    maxServers: 1
  })
  const [activeEnvironment, setActiveEnvironment] = useState<EnvironmentProfile | undefined>()

  // Server metadata cache
  const [serverMetadata, setServerMetadata] = useState<
    Record<
      string,
      {
        tools: McpTool[]
        resources: McpResource[]
        prompts: McpPrompt[]
      }
    >
  >({})

  // Loaded request for ToolInspector & Simulator
  const [loadedRequest, setLoadedRequest] = useState<SavedRequest | null>(null)
  const [simulatorInitialPrompt, setSimulatorInitialPrompt] = useState<string>('')

  // Consolidated Modals & Drawers
  const [activeModal, setActiveModal] = useState<ActiveModal>(null)
  const [settingsInitialTab, setSettingsInitialTab] = useState<SettingsTab>('vault')
  const [notifications, setNotifications] = useState<StudioNotification[]>(() => {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch {
      // fallback to initial welcome notification
    }
    return [
      {
        id: 'notif_welcome',
        title: 'MCP Studio Engine Ready',
        message: 'Protocol supervisor, Ollama AI simulator, and live telemetry modules initialized successfully.',
        type: 'success',
        category: 'system',
        timestamp: Date.now(),
        read: false
      }
    ]
  })

  // Persist notifications up to 100 items
  useEffect(() => {
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications.slice(0, 100)))
    } catch {
      // storage unavailable or full
    }
  }, [notifications])

  // Global event listener for studio:notification
  useEffect(() => {
    const handleCustomNotification = (e: Event) => {
      const detail = (e as CustomEvent<StudioNotification>).detail
      if (detail && detail.id) {
        setNotifications((prev) => [detail, ...prev].slice(0, 100))
      }
    }

    window.addEventListener(NOTIFICATION_EVENT, handleCustomNotification)
    return () => {
      window.removeEventListener(NOTIFICATION_EVENT, handleCustomNotification)
    }
  }, [])

  const handleClearNotifications = useCallback(() => setNotifications([]), [])
  const handleMarkAllNotificationsRead = useCallback(
    () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))),
    []
  )
  const handleDeleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const handleExecuteNotificationAction = useCallback((actionType: NotificationActionType) => {
    switch (actionType) {
      case 'restart-update':
        window.api?.updater?.quitAndInstall?.()
        break
      case 'open-settings':
        setActiveModal('settings')
        break
      case 'open-license':
        setActiveModal('license')
        break
      case 'open-tools':
        setActiveTab('tools')
        break
    }
  }, [])

  const [editingServer, setEditingServer] = useState<McpServerConfig | null>(null)
  const [serverToDelete, setServerToDelete] = useState<McpServerConfig | null>(null)
  const [lockedServerTarget, setLockedServerTarget] = useState<McpServerConfig | null>(null)
  const [isStorageInitialized, setIsStorageInitialized] = useState<boolean>(false)

  const handleOpenServerLimitModal = useCallback((server?: McpServerConfig) => {
    setLockedServerTarget(server || null)
    setActiveModal('serverLimit')
  }, [])
  const [discoveredSources, setDiscoveredSources] = useState<
    {
      source: string
      servers: Omit<McpServerConfig, 'id' | 'status' | 'createdAt'>[]
    }[]
  >([])

  // Load initial servers, license & environment
  useEffect(() => {
    // 1. Load License
    window.api.license.getStatus().then((status) => {
      setLicense(status)
    })

    const cleanupLicense = window.api.license.onStatusChange?.((newStatus) => {
      setLicense((prev) => {
        if (prev.isPro && !newStatus.isPro) {
          dispatchNotification({
            title: 'License Inactive',
            message: 'Your license key was deactivated or deleted. MCP Studio reverted to Community Edition.',
            type: 'error',
            category: 'license',
            actionLabel: 'Open License Manager',
            actionType: 'open-license'
          })
        }
        return newStatus
      })
    })

    // 1b. Listen to Auto-Updater status changes
    const cleanupUpdater = window.api.updater?.onUpdateStatus?.((status) => {
      if (status.status === 'available') {
        dispatchNotification({
          title: 'Update Available',
          message: `A new version of MCP Studio (${status.version || 'latest'}) is available for download.`,
          type: 'info',
          category: 'updater',
          actionLabel: 'Open Settings',
          actionType: 'open-settings'
        })
      } else if (status.status === 'downloaded') {
        dispatchNotification({
          title: 'Update Ready to Install',
          message: `MCP Studio v${status.version || ''} has been downloaded. Restart now to apply updates.`,
          type: 'success',
          category: 'updater',
          actionLabel: 'Restart Now',
          actionType: 'restart-update'
        })
      }
    })


    // 2. Load Active Environment
    loadActiveEnvironment()

    // 3. Load Servers from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored !== null) {
        const parsed: McpServerConfig[] = JSON.parse(stored)
        // Ensure that servers loaded from storage are set to 'disconnected' on initial launch
        // Subprocesses from prior sessions are closed by the OS
        const sanitized = parsed.map((s) => ({
          ...s,
          status: 'disconnected' as const
        }))
        setServers(sanitized)
        if (sanitized[0]) {
          setActiveServerId(sanitized[0].id)
        }
      } else {
        const defaultServer: McpServerConfig = {
          id: 'demo-sample-server',
          name: 'Demo System Tools',
          transport: 'stdio',
          command: 'node',
          args: ['-e', 'console.log("MCP demo")'],
          status: 'connected',
          createdAt: Date.now()
        }
        setServers([defaultServer])
        setActiveServerId(defaultServer.id)
        localStorage.setItem(STORAGE_KEY, JSON.stringify([defaultServer]))
        setServerMetadata({
          'demo-sample-server': {
            tools: [
              {
                name: 'query_database',
                description: 'Executes a safe read-only SQL query against the sample database and returns rows.',
                inputSchema: {
                  type: 'object',
                  properties: {
                    sql: {
                      type: 'string',
                      description: 'The SELECT SQL query string to run (e.g. SELECT * FROM users LIMIT 10)'
                    },
                    maxRows: {
                      type: 'number',
                      description: 'Maximum number of records to return'
                    }
                  },
                  required: ['sql']
                }
              },
              {
                name: 'analyze_security',
                description: 'Performs static AST security auditing on a code snippet or configuration file.',
                inputSchema: {
                  type: 'object',
                  properties: {
                    sourceCode: {
                      type: 'string',
                      description: 'The code content to audit for security vulnerabilities'
                    },
                    severityLevel: {
                      type: 'string',
                      enum: ['low', 'medium', 'high', 'critical'],
                      description: 'Minimum severity threshold to report'
                    }
                  },
                  required: ['sourceCode']
                }
              },
              {
                name: 'calculate_metrics',
                description: 'Calculates performance metrics, latency p99, and token optimization scores.',
                inputSchema: {
                  type: 'object',
                  properties: {
                    datasetId: {
                      type: 'string',
                      description: 'Identifier of the benchmark dataset'
                    }
                  },
                  required: ['datasetId']
                }
              }
            ],
            resources: [
              {
                uri: 'file:///system/config.json',
                name: 'System Configuration',
                mimeType: 'application/json',
                description: 'Global system configuration parameters and security limits.'
              }
            ],
            prompts: [
              {
                name: 'summarize_diagnostics',
                description: 'Analyzes recent server logs and produces a structured health report.',
                arguments: [
                  {
                    name: 'serviceName',
                    description: 'Name of the service to inspect',
                    required: true
                  }
                ]
              }
            ]
          }
        })
      }
    } catch (err) {
      console.error('Failed to parse stored servers:', err)
    } finally {
      setIsStorageInitialized(true)
    }

    // Check first-run onboarding
    try {
      const hasCompletedOnboarding = localStorage.getItem(ONBOARDING_STORAGE_KEY)
      if (!hasCompletedOnboarding) {
        setActiveModal('onboarding')
      }
    } catch {
      // Ignore localStorage read error
    }

    // 4. Listen to real-time traffic logs & console logs
    const cleanupTraffic = window.api.mcp.onTrafficLog((log) => {
      setTrafficLogs((prev) => [...prev.slice(-499), log])
    })

    const cleanupConsole = window.api.mcp.onConsoleLog((log) => {
      setConsoleLogs((prev) => [...prev.slice(-999), log])
    })

    const cleanupStatus = window.api.mcp.onServerStatusChange?.((data) => {
      setServers((prev) =>
        prev.map((s) => (s.id === data.serverId ? { ...s, status: data.status } : s))
      )
      if (data.metadata) {
        setServerMetadata((prev) => ({
          ...prev,
          [data.serverId]: data.metadata!
        }))
      }
      if (data.error) {
        dispatchNotification({
          title: 'Connection Lost',
          message: data.error!,
          type: 'error',
          category: 'servers'
        })
      } else if (data.status === 'connected') {
        dispatchNotification({
          title: 'Server Reconnected',
          message: 'Server auto-reconnected successfully.',
          type: 'success',
          category: 'servers'
        })
      }
    })

    return () => {
      cleanupTraffic()
      cleanupConsole()
      cleanupStatus?.()
      cleanupUpdater?.()
      cleanupLicense?.()
    }
  }, [])

  // Enforce server selection within tier limits when license status changes
  useEffect(() => {
    if (!license.isPro && servers.length > (license.maxServers || 1)) {
      const activeIdx = servers.findIndex((s) => s.id === activeServerId)
      if (activeIdx >= (license.maxServers || 1)) {
        setActiveServerId(servers[0]?.id || null)
      }
    }
  }, [license.isPro, license.maxServers, servers, activeServerId])

  // Global Keyboard Shortcuts (? or Ctrl+/ for shortcuts, Ctrl+K for command palette)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setActiveModal((prev) => (prev === 'commandPalette' ? null : 'commandPalette'))
      } else if (e.key === '?' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault()
        setActiveModal('shortcuts')
      } else if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault()
        setActiveModal('shortcuts')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const loadActiveEnvironment = useCallback(async () => {
    const env = await window.api.storage.getActiveEnvironment()
    setActiveEnvironment(env)
  }, [])

  // Persist servers (once storage has been initialized)
  useEffect(() => {
    if (isStorageInitialized) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(servers))
    }
  }, [servers, isStorageInitialized])

  // Fallback activeServerId if currently pointing to a locked server on Free tier
  useEffect(() => {
    if (!license.isPro && servers.length > 0) {
      const activeIndex = servers.findIndex((s) => s.id === activeServerId)
      if (activeIndex >= (license.maxServers || 1) && servers[0]) {
        setActiveServerId(servers[0].id)
      }
    }
  }, [license.isPro, license.maxServers, servers, activeServerId])

  const activeServer = useMemo(() => {
    if (!license.isPro && servers.length > 0) {
      const activeIndex = servers.findIndex((s) => s.id === activeServerId)
      if (activeIndex >= (license.maxServers || 1)) {
        return servers[0]
      }
    }
    return servers.find((s) => s.id === activeServerId) || servers[0]
  }, [servers, activeServerId, license.isPro, license.maxServers])
  const activeMetadata = useMemo(
    () => (activeServerId ? serverMetadata[activeServerId] : undefined),
    [serverMetadata, activeServerId]
  )

  // Server Management
  const handleConnectServer = useCallback(
    async (server: McpServerConfig) => {
      // Free tier server limit check: cannot connect servers beyond allowed maxServers
      const serverIndex = servers.findIndex((s) => s.id === server.id)
      if (!license.isPro && serverIndex >= (license.maxServers || 1)) {
        handleOpenServerLimitModal(server)
        return
      }

      // Pro check for multiple connected servers
      const connectedCount = servers.filter((s) => s.status === 'connected').length
      if (!license.isPro && connectedCount >= license.maxServers && server.status !== 'connected') {
        handleOpenServerLimitModal(server)
        return
      }

      setServers((prev) =>
        prev.map((s) => (s.id === server.id ? { ...s, status: 'connecting', error: undefined } : s))
      )

      const res = await window.api.mcp.connectServer(server)

      if (res.success) {
        setServers((prev) =>
          prev.map((s) => (s.id === server.id ? { ...s, status: 'connected', error: undefined } : s))
        )
        const toolCount = (res.tools || []).length
        const resCount = (res.resources || []).length
        const promptCount = (res.prompts || []).length
        setServerMetadata((prev) => ({
          ...prev,
          [server.id]: {
            tools: res.tools || [],
            resources: res.resources || [],
            prompts: res.prompts || []
          }
        }))
        playSuccessSound()
        dispatchNotification({
          title: 'Server Connected',
          message: `Connected to "${server.name}" (${toolCount} tools, ${resCount} resources, ${promptCount} prompts discovered).`,
          type: 'success',
          category: 'servers',
          actionLabel: 'View Tools',
          actionType: 'open-tools'
        })
      } else {
        setServers((prev) =>
          prev.map((s) => (s.id === server.id ? { ...s, status: 'error', error: res.error } : s))
        )
        playErrorSound()
        dispatchNotification({
          title: 'Connection Failed',
          message: `Failed to connect to "${server.name}": ${res.error || 'Unknown error'}`,
          type: 'error',
          category: 'servers'
        })
      }
    },
    [servers, license, handleOpenServerLimitModal]
  )

  const handleDisconnectServer = useCallback(
    async (serverId: string) => {
      const s = servers.find((srv) => srv.id === serverId)
      await window.api.mcp.disconnectServer(serverId)
      setServers((prev) =>
        prev.map((item) => (item.id === serverId ? { ...item, status: 'disconnected', error: undefined } : item))
      )
      if (s) {
        dispatchNotification({
          title: 'Server Disconnected',
          message: `Disconnected from "${s.name}". Subprocesses and pipes closed safely.`,
          type: 'info',
          category: 'servers'
        })
      }
    },
    [servers]
  )

  const handleAddServer = useCallback(
    (newConfig: McpServerInput | Omit<McpServerConfig, 'id' | 'status' | 'createdAt'> | Omit<McpServerConfig, 'id' | 'createdAt' | 'status'>) => {
      const newServer: McpServerConfig =
        newConfig.transport === 'stdio'
          ? ({
              ...newConfig,
              transport: 'stdio',
              command: (newConfig as any).command || 'node',
              id: 'srv_' + crypto.randomUUID(),
              status: 'disconnected',
              createdAt: Date.now()
            } as McpStdioServerConfig)
          : ({
              ...newConfig,
              transport: 'sse',
              url: (newConfig as any).url || '',
              id: 'srv_' + crypto.randomUUID(),
              status: 'disconnected',
              createdAt: Date.now()
            } as McpSseServerConfig)

      const isExceeded = !license.isPro && servers.length >= (license.maxServers || 1)
      const updated = [...servers, newServer]
      setServers(updated)
      setActiveModal(null)

      dispatchNotification({
        title: 'Server Added',
        message: `MCP server "${newServer.name}" added to your workspace.`,
        type: 'info',
        category: 'servers'
      })

      if (isExceeded) {
        handleOpenServerLimitModal(newServer)
        return
      }

      setActiveServerId(newServer.id)
      if (newConfig.autoConnect) {
        handleConnectServer(newServer)
      }
    },
    [servers, license, handleConnectServer, handleOpenServerLimitModal]
  )

  const handleEditServer = useCallback((server: McpServerConfig) => {
    setEditingServer(server)
    setActiveModal('addServer')
  }, [])

  const handleSaveOrUpdateServer = useCallback(
    (config: McpServerConfig) => {
      if (editingServer) {
        const updated = servers.map((s) => (s.id === config.id ? config : s))
        setServers(updated)
        setEditingServer(null)
        setActiveModal(null)
        if (editingServer.status === 'connected') {
          handleDisconnectServer(config.id).then(() => {
            handleConnectServer(config)
          })
        }
      } else {
        handleAddServer(config)
      }
    },
    [editingServer, servers, handleDisconnectServer, handleConnectServer, handleAddServer]
  )

  const handleDeleteServerRequest = useCallback((server: McpServerConfig) => {
    setServerToDelete(server)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!serverToDelete) return
    const serverId = serverToDelete.id
    const serverName = serverToDelete.name
    setServerToDelete(null)
    await window.api.mcp.disconnectServer(serverId)
    const updated = servers.filter((s) => s.id !== serverId)
    setServers(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    if (activeServerId === serverId) {
      setActiveServerId(updated[0]?.id || null)
    }
    dispatchNotification({
      title: 'Server Removed',
      message: `MCP server "${serverName}" was removed from your workspace.`,
      type: 'info',
      category: 'servers'
    })
  }, [serverToDelete, servers, activeServerId])

  const handleAutoDiscover = useCallback(async () => {
    const sources = await window.api.mcp.discoverServers()
    setDiscoveredSources(sources)
    setActiveModal('discover')
  }, [])

  const handleImportDiscovered = useCallback(
    (configs: (McpServerInput | Omit<McpServerConfig, 'id' | 'status' | 'createdAt'>)[]) => {
      const newServers: McpServerConfig[] = configs.map((c) =>
        c.transport === 'stdio'
          ? ({
              ...c,
              transport: 'stdio',
              command: (c as any).command || 'node',
              id: 'srv_' + crypto.randomUUID(),
              status: 'disconnected',
              createdAt: Date.now()
            } as McpStdioServerConfig)
          : ({
              ...c,
              transport: 'sse',
              url: (c as any).url || '',
              id: 'srv_' + crypto.randomUUID(),
              status: 'disconnected',
              createdAt: Date.now()
            } as McpSseServerConfig)
      )

      setServers((prev) => {
        const next = [...prev, ...newServers]
        if (prev.length === 0 && newServers[0]) {
          setActiveServerId(newServers[0].id)
        }
        return next
      })
      setActiveModal(null)

      dispatchNotification({
        title: 'Servers Imported',
        message: `Successfully imported ${newServers.length} MCP server${newServers.length > 1 ? 's' : ''} from Claude Desktop & Cursor configs.`,
        type: 'success',
        category: 'servers'
      })

      if (!license.isPro && servers.length + newServers.length > (license.maxServers || 1)) {
        setTimeout(() => {
          handleOpenServerLimitModal(newServers[0])
        }, 200)
      }
    },
    [license.isPro, license.maxServers, servers.length, handleOpenServerLimitModal]
  )

  const handleExecuteTool = useCallback(
    async (toolName: string, args: Record<string, any>) => {
      if (!activeServerId || !activeServer) {
        return { success: false, error: 'No active server selected' }
      }
      const res = await window.api.mcp.callTool(activeServerId, activeServer.name, toolName, args)
      if (res && res.success) {
        playSuccessSound()
      } else {
        playErrorSound()
      }
      return res
    },
    [activeServerId, activeServer]
  )

  const handleReadResource = useCallback(
    async (uri: string) => {
      if (!activeServerId) {
        return { success: false, error: 'No active server selected' }
      }
      return await window.api.mcp.readResource(activeServerId, uri)
    },
    [activeServerId]
  )

  const handleGetPrompt = useCallback(
    async (promptName: string, args?: Record<string, string>) => {
      if (!activeServerId) {
        return { success: false, error: 'No active server selected' }
      }
      return await window.api.mcp.getPrompt(activeServerId, promptName, args)
    },
    [activeServerId]
  )

  const handleLoadSavedRequest = useCallback(
    (req: SavedRequest) => {
      const matchingServer = servers.find((s) => s.id === req.serverId)
      if (matchingServer) {
        setActiveServerId(matchingServer.id)
      }
      setLoadedRequest(req)
      setActiveTab('tools')
    },
    [servers]
  )

  const handleReplayHistory = useCallback(
    (entry: ToolExecutionHistory) => {
      const fakeSaved: SavedRequest = {
        id: 'replay_' + entry.id,
        name: `Replay ${entry.toolName}`,
        serverId: entry.serverId,
        serverName: entry.serverName,
        toolName: entry.toolName,
        arguments: entry.arguments,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      handleLoadSavedRequest(fakeSaved)
    },
    [handleLoadSavedRequest]
  )

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  )

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-studio-950 text-slate-100 font-sans select-none">
      {/* Top Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        license={license}
        activeEnvironment={activeEnvironment}
        onOpenLicenseModal={() => setActiveModal('license')}
        onOpenEnvironmentsModal={() => setActiveModal('environment')}
        onOpenCollectionsDrawer={() => setActiveModal('collections')}
        onOpenCommandPalette={() => setActiveModal('commandPalette')}
        onOpenSettingsModal={(tab) => {
          if (tab) setSettingsInitialTab(tab)
          setActiveModal('settings')
        }}
        onOpenShortcutsModal={() => setActiveModal('shortcuts')}
        onOpenThemeModal={() => setActiveModal('theme')}
        onOpenNotifications={() => setActiveModal('notification')}
        onOpenToolkit={() => setActiveModal('toolkit')}
        onOpenOnboarding={() => setActiveModal('onboarding')}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      {/* Main Studio Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Server Sidebar */}
        <ServerSidebar
          servers={servers}
          activeServerId={activeServerId}
          setActiveServerId={setActiveServerId}
          onOpenAddModal={() => {
            setEditingServer(null)
            setActiveModal('addServer')
          }}
          onOpenHubModal={() => setActiveModal('hub')}
          onOpenDiscoverModal={handleAutoDiscover}
          onConnectServer={handleConnectServer}
          onDisconnectServer={handleDisconnectServer}
          onDeleteServer={handleDeleteServerRequest}
          onEditServer={handleEditServer}
          license={license}
          onOpenLicenseModal={() => setActiveModal('license')}
          onOpenServerLimitModal={handleOpenServerLimitModal}
          serverMetadataMap={serverMetadata}
        />

        {/* Center Active Workspace Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-studio-900/40 relative">
          <ServerTabsBar
            servers={servers}
            activeServerId={activeServerId}
            onSelectServer={(id) => {
              const targetIndex = servers.findIndex((s) => s.id === id)
              if (!license.isPro && targetIndex >= (license.maxServers || 1)) {
                const target = servers.find((s) => s.id === id)
                handleOpenServerLimitModal(target)
                return
              }
              setActiveServerId(id)
            }}
            onOpenHubModal={() => setActiveModal('hub')}
            onDisconnectServer={handleDisconnectServer}
            serverMetadataMap={serverMetadata}
          />

          <ErrorBoundary fallbackTitle="Active Workspace View Interrupted">
            <div className={`flex-1 flex flex-col overflow-hidden ${activeTab === 'tools' ? '' : 'hidden'}`}>
              <ToolInspector
              tools={activeMetadata?.tools || []}
              server={activeServer}
              serverId={activeServer?.id || ''}
              serverName={activeServer?.name || ''}
              serverStatus={activeServer?.status}
              loadedRequest={loadedRequest}
              onExecuteTool={handleExecuteTool}
              onOpenCollections={() => setActiveModal('collections')}
              onConnectServer={() => activeServer && handleConnectServer(activeServer)}
            />
          </div>

          <div className={`flex-1 flex flex-col overflow-hidden ${activeTab === 'resources' ? '' : 'hidden'}`}>
            <ResourceViewer
              resources={activeMetadata?.resources || []}
              serverId={activeServer?.id || ''}
              serverName={activeServer?.name || ''}
              serverStatus={activeServer?.status}
              onConnectServer={() => activeServer && handleConnectServer(activeServer)}
              onReadResource={handleReadResource}
            />
          </div>

          <div className={`flex-1 flex flex-col overflow-hidden ${activeTab === 'prompts' ? '' : 'hidden'}`}>
            <PromptTester
              prompts={activeMetadata?.prompts || []}
              serverId={activeServer?.id || ''}
              serverName={activeServer?.name || ''}
              serverStatus={activeServer?.status}
              onConnectServer={() => activeServer && handleConnectServer(activeServer)}
              onGetPrompt={handleGetPrompt}
              onSendToSimulator={(promptText) => {
                if (promptText) {
                  setSimulatorInitialPrompt(promptText)
                }
                setActiveTab('simulator')
              }}
            />
          </div>

          <div className={`flex-1 flex flex-col overflow-hidden ${activeTab === 'simulator' ? '' : 'hidden'}`}>
            {isEeAvailable ? (
              <AiSimulator
                tools={activeMetadata?.tools || []}
                serverId={activeServer?.id || ''}
                serverName={activeServer?.name || ''}
                serverStatus={activeServer?.status}
                onConnectServer={() => activeServer && handleConnectServer(activeServer)}
                license={license}
                onOpenLicenseModal={() => setActiveModal('license')}
                initialPrompt={simulatorInitialPrompt}
                onOpenSettings={(tab: SettingsTab = 'vault') => {
                  setSettingsInitialTab(tab)
                  setActiveModal('settings')
                }}
              />
            ) : (
              <CommunityUpsellCard featureName="Multi-LLM AI Agent Simulator" />
            )}
          </div>

          <div className={`flex-1 flex flex-col overflow-hidden ${activeTab === 'traffic' ? '' : 'hidden'}`}>
            <TrafficInspector
              logs={trafficLogs}
              onClearLogs={() => setTrafficLogs([])}
              onReplayTool={(serverId, toolName, args, targetTab = 'tools') => {
                setActiveServerId(serverId)
                if (targetTab === 'simulator') {
                  const promptText = `Please execute the tool "${toolName}" with the following arguments:\n${JSON.stringify(args, null, 2)}`
                  setSimulatorInitialPrompt(promptText)
                  setActiveTab('simulator')
                } else {
                  setActiveTab('tools')
                  setLoadedRequest({
                    id: 'replay_' + Date.now(),
                    name: `Replay ${toolName}`,
                    serverId,
                    serverName: servers.find((s) => s.id === serverId)?.name || 'Server',
                    toolName,
                    arguments: args,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                  })
                }
              }}
            />
          </div>

          <div className={`flex-1 flex flex-col overflow-hidden ${activeTab === 'analytics' ? '' : 'hidden'}`}>
            <AnalyticsDashboard
              logs={trafficLogs}
              servers={servers}
              serverMetadataMap={serverMetadata}
              onSelectTab={setActiveTab}
            />
          </div>
          </ErrorBoundary>
        </main>
      </div>

      {/* Live Server Process Console Drawer */}
      <ConsoleDrawer
        logs={consoleLogs}
        onClearLogs={() => setConsoleLogs([])}
        activeServerName={activeServer?.name}
      />

      {/* Modals & Drawers */}
      <ErrorBoundary fallbackTitle="Modal Dialog Error">
        <Suspense fallback={null}>
          <AddServerModal
            isOpen={activeModal === 'addServer'}
            onClose={() => {
              setActiveModal(null)
              setEditingServer(null)
            }}
            onAddServer={handleSaveOrUpdateServer}
            initialConfig={editingServer}
          />

          <ServerHubModal
            isOpen={activeModal === 'hub'}
            onClose={() => setActiveModal(null)}
            onInstallPreset={handleAddServer}
          />

          <TestSuiteModal
            isOpen={activeModal === 'testSuite'}
            onClose={() => setActiveModal(null)}
            servers={servers}
            serverMetadataMap={serverMetadata}
          />

          <MockServerModal
            isOpen={activeModal === 'mock'}
            onClose={() => setActiveModal(null)}
            onAddMockServer={(newServer: any) => {
              handleAddServer(newServer)
            }}
          />

          <ExportModal
            isOpen={activeModal === 'export'}
            onClose={() => setActiveModal(null)}
            servers={servers}
          />

          <DocsExporterModal
            isOpen={activeModal === 'docs'}
            onClose={() => setActiveModal(null)}
            server={activeServer}
            tools={activeMetadata?.tools || []}
            resources={activeMetadata?.resources || []}
            prompts={activeMetadata?.prompts || []}
          />

          <CommandPalette
            isOpen={activeModal === 'commandPalette'}
            onClose={() => setActiveModal(null)}
            servers={servers}
            serverMetadataMap={serverMetadata}
            onSelectServer={setActiveServerId}
            onSelectTab={setActiveTab}
            onOpenTestSuites={() => setActiveModal('testSuite')}
            onOpenMockServer={() => setActiveModal('mock')}
            onOpenHub={() => setActiveModal('hub')}
            onOpenDocs={() => setActiveModal('docs')}
            onOpenEnvironments={() => setActiveModal('environment')}
            onOpenExport={() => setActiveModal('export')}
            onOpenBenchmark={() => setActiveModal('benchmark')}
            onOpenSecurityAuditor={() => setActiveModal('security')}
            onOpenSettings={(tab) => {
              if (tab) setSettingsInitialTab(tab)
              setActiveModal('settings')
            }}
            onOpenScaffolder={() => setActiveModal('scaffolder')}
            onOpenWorkflow={() => setActiveModal('workflow')}
            onOpenSchemaDiff={() => setActiveModal('schemaDiff')}
            onOpenShortcuts={() => setActiveModal('shortcuts')}
            onOpenRemoteBridge={() => setActiveModal('remoteBridge')}
            onOpenThemeModal={() => setActiveModal('theme')}
            onOpenOpenApiModal={() => setActiveModal('openApi')}
            onOpenWatchdog={() => setActiveModal('watchdog')}
            onOpenDockerPackager={() => setActiveModal('docker')}
            onOpenSessionRecorder={() => setActiveModal('recorder')}
            onOpenModelArena={() => setActiveModal('arena')}
            onOpenInterceptor={() => setActiveModal('interceptor')}
            onOpenNotifications={() => setActiveModal('notification')}
          />

          <ModelArenaModal
            isOpen={activeModal === 'arena'}
            onClose={() => setActiveModal(null)}
            tools={activeMetadata?.tools || []}
            server={activeServer}
          />

          <TrafficInterceptorModal
            isOpen={activeModal === 'interceptor'}
            onClose={() => setActiveModal(null)}
            tools={activeMetadata?.tools || []}
            servers={servers}
          />

          <NotificationCenterModal
            isOpen={activeModal === 'notification'}
            onClose={() => setActiveModal(null)}
            notifications={notifications}
            onClearAll={handleClearNotifications}
            onMarkAllRead={handleMarkAllNotificationsRead}
            onDeleteNotification={handleDeleteNotification}
            onExecuteAction={handleExecuteNotificationAction}
          />

          <DeveloperToolkitModal
            isOpen={activeModal === 'toolkit'}
            onClose={() => setActiveModal(null)}
            onOpenTestSuites={() => setActiveModal('testSuite')}
            onOpenBenchmark={() => setActiveModal('benchmark')}
            onOpenSecurityAuditor={() => setActiveModal('security')}
            onOpenModelArena={() => setActiveModal('arena')}
            onOpenMockServer={() => setActiveModal('mock')}
            onOpenScaffolder={() => setActiveModal('scaffolder')}
            onOpenWorkflow={() => setActiveModal('workflow')}
            onOpenSchemaDiff={() => setActiveModal('schemaDiff')}
            onOpenOpenApi={() => setActiveModal('openApi')}
            onOpenDocs={() => setActiveModal('docs')}
            onOpenWatchdog={() => setActiveModal('watchdog')}
            onOpenInterceptor={() => setActiveModal('interceptor')}
            onOpenDockerPackager={() => setActiveModal('docker')}
            onOpenRemoteBridge={() => setActiveModal('remoteBridge')}
            onOpenSessionRecorder={() => setActiveModal('recorder')}
          />

          <ServerScaffolderModal
            isOpen={activeModal === 'scaffolder'}
            onClose={() => setActiveModal(null)}
            onAddServerToStudio={handleAddServer}
          />

          <WorkflowBuilderModal
            isOpen={activeModal === 'workflow'}
            onClose={() => setActiveModal(null)}
            servers={servers}
            serverMetadataMap={serverMetadata}
          />

          <SchemaDiffModal
            isOpen={activeModal === 'schemaDiff'}
            onClose={() => setActiveModal(null)}
            servers={servers}
            serverMetadataMap={serverMetadata}
          />

          <ShortcutsModal
            isOpen={activeModal === 'shortcuts'}
            onClose={() => setActiveModal(null)}
          />

          <RemoteBridgeModal
            isOpen={activeModal === 'remoteBridge'}
            onClose={() => setActiveModal(null)}
            onAddServer={handleAddServer}
          />

          <ThemeSelectorModal
            isOpen={activeModal === 'theme'}
            onClose={() => setActiveModal(null)}
          />

          <OpenApiConverterModal
            isOpen={activeModal === 'openApi'}
            onClose={() => setActiveModal(null)}
            onAddServer={handleAddServer}
          />

          <ProcessWatchdogModal
            isOpen={activeModal === 'watchdog'}
            onClose={() => setActiveModal(null)}
            servers={servers}
            serverMetadataMap={serverMetadata}
            onRestartServer={handleConnectServer}
            onDisconnectServer={handleDisconnectServer}
          />

          <DockerPackagerModal
            isOpen={activeModal === 'docker'}
            onClose={() => setActiveModal(null)}
            server={activeServer}
            tools={activeMetadata?.tools || []}
          />

          <SessionRecorderModal
            isOpen={activeModal === 'recorder'}
            onClose={() => setActiveModal(null)}
            logs={trafficLogs}
            servers={servers}
          />

          <BenchmarkRunnerModal
            isOpen={activeModal === 'benchmark'}
            onClose={() => setActiveModal(null)}
            servers={servers}
            serverMetadataMap={serverMetadata}
          />

          <SecurityAuditorModal
            isOpen={activeModal === 'security'}
            onClose={() => setActiveModal(null)}
            servers={servers}
            serverMetadataMap={serverMetadata}
          />

          <SettingsModal
            isOpen={activeModal === 'settings'}
            onClose={() => setActiveModal(null)}
            initialTab={settingsInitialTab}
            onReplayOnboarding={() => setActiveModal('onboarding')}
          />

          <OnboardingModal
            isOpen={activeModal === 'onboarding'}
            onClose={() => setActiveModal(null)}
            onOpenServerHub={() => setActiveModal('hub')}
            onOpenDiscovery={handleAutoDiscover}
            onOpenSettings={(tab = 'vault') => {
              setSettingsInitialTab(tab)
              setActiveModal('settings')
            }}
          />

          <WorkspaceTransferModal
            isOpen={activeModal === 'transfer'}
            onClose={() => setActiveModal(null)}
            servers={servers}
            onImportComplete={() => {
              loadActiveEnvironment()
            }}
          />

          <LicenseModal
            isOpen={activeModal === 'license'}
            onClose={() => setActiveModal(null)}
            license={license}
            onLicenseUpdated={() => {
              window.api.license.getStatus().then(setLicense)
            }}
          />

          <EnvironmentModal
            isOpen={activeModal === 'environment'}
            onClose={() => setActiveModal(null)}
            onEnvironmentChanged={loadActiveEnvironment}
          />

          <CollectionsDrawer
            isOpen={activeModal === 'collections'}
            onClose={() => setActiveModal(null)}
            onLoadRequest={handleLoadSavedRequest}
            onReplayHistory={handleReplayHistory}
          />

          {/* Auto-Discovery Modal */}
          <AutoDiscoverModal
            isOpen={activeModal === 'discover'}
            onClose={() => setActiveModal(null)}
            sources={discoveredSources}
            existingServers={servers}
            onImportServers={handleImportDiscovered}
          />

          {/* Confirm Delete Server Modal */}
          <ConfirmDeleteModal
            isOpen={!!serverToDelete}
            server={serverToDelete}
            onConfirm={handleConfirmDelete}
            onClose={() => setServerToDelete(null)}
          />

          {/* Free Tier Server Limit Warning Modal */}
          <ServerLimitModal
            isOpen={activeModal === 'serverLimit'}
            onClose={() => {
              setActiveModal(null)
              setLockedServerTarget(null)
            }}
            onOpenLicenseModal={() => {
              setActiveModal('license')
            }}
            lockedServer={lockedServerTarget}
            totalServersCount={servers.length}
            maxAllowed={license.maxServers || 1}
          />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
