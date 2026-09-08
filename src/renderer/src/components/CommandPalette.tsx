import React, { useState, useEffect } from 'react'
import {
  Search,
  Server,
  Layers,
  FlaskConical,
  Bot,
  Globe,
  BookOpen,
  Share2,
  Terminal,
  Sparkles,
  ArrowRight,
  Zap,
  Shield,
  Settings,
  FolderPlus,
  Workflow,
  GitCompare,
  Radio,
  Keyboard,
  Palette,
  Cpu,
  Boxes,
  Activity,
  Video,
  Swords,
  ShieldAlert,
  Bell,
  FileCode,
  BarChart3,
  RefreshCw,
  Info
} from 'lucide-react'
import { McpServerConfig, McpTool, McpResource, McpPrompt } from '../../../shared/types'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  servers: McpServerConfig[]
  serverMetadataMap: Record<
    string,
    {
      tools: McpTool[]
      resources: McpResource[]
      prompts: McpPrompt[]
    }
  >
  onSelectServer: (id: string) => void
  onSelectTab: (tab: 'tools' | 'resources' | 'prompts' | 'simulator' | 'traffic' | 'analytics') => void
  onOpenTestSuites: () => void
  onOpenMockServer: () => void
  onOpenHub: () => void
  onOpenDocs: () => void
  onOpenEnvironments: () => void
  onOpenExport: () => void
  onOpenBenchmark?: () => void
  onOpenSecurityAuditor?: () => void
  onOpenSettings?: (tab?: 'vault' | 'engine' | 'about') => void
  onOpenScaffolder?: () => void
  onOpenWorkflow?: () => void
  onOpenSchemaDiff?: () => void
  onOpenShortcuts?: () => void
  onOpenRemoteBridge?: () => void
  onOpenThemeModal?: () => void
  onOpenOpenApiModal?: () => void
  onOpenWatchdog?: () => void
  onOpenDockerPackager?: () => void
  onOpenSessionRecorder?: () => void
  onOpenModelArena?: () => void
  onOpenInterceptor?: () => void
  onOpenNotifications?: () => void
}

interface PaletteItem {
  id: string
  title: string
  subtitle: string
  category: 'Tools' | 'Resources' | 'Prompts' | 'Servers' | 'Navigation' | 'Actions'
  icon: React.ReactNode
  action: () => void
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  servers,
  serverMetadataMap,
  onSelectServer,
  onSelectTab,
  onOpenTestSuites,
  onOpenMockServer,
  onOpenHub,
  onOpenDocs,
  onOpenEnvironments,
  onOpenExport,
  onOpenBenchmark,
  onOpenSecurityAuditor,
  onOpenSettings,
  onOpenScaffolder,
  onOpenWorkflow,
  onOpenSchemaDiff,
  onOpenShortcuts,
  onOpenRemoteBridge,
  onOpenThemeModal,
  onOpenOpenApiModal,
  onOpenWatchdog,
  onOpenDockerPackager,
  onOpenSessionRecorder,
  onOpenModelArena,
  onOpenInterceptor,
  onOpenNotifications
}) => {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Listen to keyboard navigation inside palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action()
          onClose()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, query])

  // Reset index when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  if (!isOpen) return null

  // Build items list
  const allItems: PaletteItem[] = []

  // 1. Navigation & Actions
  if (onOpenBenchmark) {
    allItems.push({
      id: 'act_bench',
      title: 'Run Concurrency & Latency Benchmark',
      subtitle: 'Measure p50/p95/p99 latency, throughput (RPS), and error rates',
      category: 'Actions',
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      action: onOpenBenchmark
    })
  }

  if (onOpenSecurityAuditor) {
    allItems.push({
      id: 'act_security',
      title: 'Run Security & Sandbox Isolation Auditor',
      subtitle: 'Detect secret leaks, path traversal, and command injection risks',
      category: 'Actions',
      icon: <Shield className="w-4 h-4 text-rose-400" />,
      action: onOpenSecurityAuditor
    })
  }

  if (onOpenSettings) {
    allItems.push({
      id: 'act_settings',
      title: 'Open Settings & API Key Vault',
      subtitle: 'Manage local persistent LLM API keys and request timeouts',
      category: 'Actions',
      icon: <Settings className="w-4 h-4 text-indigo-400" />,
      action: onOpenSettings
    })
  }

  if (onOpenScaffolder) {
    allItems.push({
      id: 'act_scaffold',
      title: 'Scaffold New MCP Server (Python, TS, Go)',
      subtitle: '1-Click boilerplate project generator with tools & configs',
      category: 'Actions',
      icon: <FolderPlus className="w-4 h-4 text-emerald-400" />,
      action: onOpenScaffolder
    })
  }

  if (onOpenWorkflow) {
    allItems.push({
      id: 'act_workflow',
      title: 'Run Multi-Tool Workflow Pipeline',
      subtitle: 'Visual tool chaining and dynamic variable orchestration',
      category: 'Actions',
      icon: <Workflow className="w-4 h-4 text-cyan-400" />,
      action: onOpenWorkflow
    })
  }

  if (onOpenSchemaDiff) {
    allItems.push({
      id: 'act_diff',
      title: 'Compare Schema Diffs & Changelog',
      subtitle: 'Analyze visual differences and modified tool parameters',
      category: 'Actions',
      icon: <GitCompare className="w-4 h-4 text-amber-400" />,
      action: onOpenSchemaDiff
    })
  }

  if (onOpenRemoteBridge) {
    allItems.push({
      id: 'act_remote',
      title: 'Remote SSE Bridge & Tunnel Gateway',
      subtitle: 'Connect to remote SSE endpoints or expose stdio over tunnel',
      category: 'Actions',
      icon: <Radio className="w-4 h-4 text-blue-400" />,
      action: onOpenRemoteBridge
    })
  }

  if (onOpenOpenApiModal) {
    allItems.push({
      id: 'act_openapi',
      title: 'Convert OpenAPI / Swagger to MCP Server',
      subtitle: '1-Click transpile REST swagger.json specifications into MCP tools',
      category: 'Actions',
      icon: <FileCode className="w-4 h-4 text-purple-400" />,
      action: onOpenOpenApiModal
    })
  }

  if (onOpenThemeModal) {
    allItems.push({
      id: 'act_theme',
      title: 'Switch Studio Theme (Dark & Light)',
      subtitle: 'Customize appearance between OLED Black, Matrix, Nordic Light and more',
      category: 'Actions',
      icon: <Palette className="w-4 h-4 text-purple-400" />,
      action: onOpenThemeModal
    })
  }

  if (onOpenWatchdog) {
    allItems.push({
      id: 'act_watchdog',
      title: 'Open MCP Process Health & Memory Watchdog',
      subtitle: 'Monitor sub-process CPU, RAM, uptime, and deadlock recovery',
      category: 'Actions',
      icon: <Activity className="w-4 h-4 text-emerald-400" />,
      action: onOpenWatchdog
    })
  }

  if (onOpenDockerPackager) {
    allItems.push({
      id: 'act_docker',
      title: 'Package Server to Docker / Cloud Deployment',
      subtitle: '1-Click generate Dockerfile, docker-compose.yml, fly.toml, and K8s specs',
      category: 'Actions',
      icon: <Boxes className="w-4 h-4 text-blue-400" />,
      action: onOpenDockerPackager
    })
  }

  if (onOpenSessionRecorder) {
    allItems.push({
      id: 'act_recorder',
      title: 'Interactive Session Recorder & Replayer',
      subtitle: 'Record live debug sessions and export .mcpsession bundles',
      category: 'Actions',
      icon: <Video className="w-4 h-4 text-rose-400" />,
      action: onOpenSessionRecorder
    })
  }

  if (onOpenModelArena) {
    allItems.push({
      id: 'act_arena',
      title: 'Run AI Model Arena Shootout',
      subtitle: 'Compare two models side-by-side on the same prompt (latency & tools)',
      category: 'Actions',
      icon: <Swords className="w-4 h-4 text-purple-400" />,
      action: onOpenModelArena
    })
  }

  if (onOpenInterceptor) {
    allItems.push({
      id: 'act_interceptor',
      title: 'MCP Gateway & Traffic Interceptor',
      subtitle: 'Set JSON-RPC breakpoints and mock response override rules',
      category: 'Actions',
      icon: <ShieldAlert className="w-4 h-4 text-amber-400" />,
      action: onOpenInterceptor
    })
  }

  if (onOpenNotifications) {
    allItems.push({
      id: 'act_notifications',
      title: 'Notification Center & System Events',
      subtitle: 'View live process watchdog logs and health alerts',
      category: 'Actions',
      icon: <Bell className="w-4 h-4 text-indigo-400" />,
      action: onOpenNotifications
    })
  }

  if (onOpenShortcuts) {
    allItems.push({
      id: 'act_shortcuts',
      title: 'Keyboard Shortcuts Cheatsheet',
      subtitle: 'View all keyboard shortcuts and hotkeys (?)',
      category: 'Actions',
      icon: <Keyboard className="w-4 h-4 text-indigo-400" />,
      action: onOpenShortcuts
    })
  }

  if (onOpenSettings) {
    allItems.push({
      id: 'act_about',
      title: 'About MCP Studio & Author Support',
      subtitle: 'View author details (Alexandr Motologa, MTLG Labs), official GitHub, and support',
      category: 'Actions',
      icon: <Info className="w-4 h-4 text-purple-400" />,
      action: () => onOpenSettings('about')
    })
    allItems.push({
      id: 'act_settings',
      title: 'Settings & API Key Vault',
      subtitle: 'Configure LLM API keys, timeout, and proxy preferences',
      category: 'Actions',
      icon: <Settings className="w-4 h-4 text-slate-400" />,
      action: () => onOpenSettings('vault')
    })
    allItems.push({
      id: 'act_check_updates',
      title: 'Check for Updates...',
      subtitle: 'Check GitHub Releases for new MCP Studio versions and release notes',
      category: 'Actions',
      icon: <RefreshCw className="w-4 h-4 text-cyan-400" />,
      action: () => onOpenSettings('about')
    })
  }

  allItems.push(
    {
      id: 'act_tests',
      title: 'Run Automated Test Suites',
      subtitle: 'Execute regression test cases and assertion suites',
      category: 'Actions',
      icon: <FlaskConical className="w-4 h-4 text-emerald-400" />,
      action: onOpenTestSuites
    },
    {
      id: 'act_mock',
      title: 'Create Mock MCP Server',
      subtitle: 'Spawn simulated offline MCP server with custom tools',
      category: 'Actions',
      icon: <Bot className="w-4 h-4 text-purple-400" />,
      action: onOpenMockServer
    },
    {
      id: 'act_hub',
      title: 'Open Official MCP Server Hub',
      subtitle: 'Browse & launch verified servers (Postgres, GitHub, SQLite)',
      category: 'Actions',
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      action: onOpenHub
    },
    {
      id: 'act_docs',
      title: 'Generate Swagger / Markdown API Docs',
      subtitle: 'Export complete API reference for connected servers',
      category: 'Actions',
      icon: <BookOpen className="w-4 h-4 text-indigo-400" />,
      action: onOpenDocs
    },
    {
      id: 'act_env',
      title: 'Manage Environment Variables',
      subtitle: 'Edit active profile variables and {{VAR}} placeholders',
      category: 'Actions',
      icon: <Globe className="w-4 h-4 text-cyan-400" />,
      action: onOpenEnvironments
    },
    {
      id: 'act_export',
      title: 'Export to Cursor & Claude Desktop',
      subtitle: '1-Click JSON config generator for AI IDEs',
      category: 'Actions',
      icon: <Share2 className="w-4 h-4 text-cyan-400" />,
      action: onOpenExport
    },
    {
      id: 'nav_simulator',
      title: 'Open Multi-LLM AI Agent Simulator',
      subtitle: 'Test tool calling with Claude 3.7, GPT-4o, and Gemini 2.0',
      category: 'Navigation',
      icon: <Cpu className="w-4 h-4 text-purple-400" />,
      action: () => onSelectTab('simulator')
    },
    {
      id: 'nav_traffic',
      title: 'Open JSON-RPC Traffic Inspector',
      subtitle: 'Inspect real-time message stream and latency benchmarks',
      category: 'Navigation',
      icon: <Terminal className="w-4 h-4 text-cyan-400" />,
      action: () => onSelectTab('traffic')
    },
    {
      id: 'nav_analytics',
      title: 'Open Real-time Telemetry & Analytics',
      subtitle: 'Inspect live latency percentiles, tool call distributions, and token usage',
      category: 'Navigation',
      icon: <BarChart3 className="w-4 h-4 text-indigo-400" />,
      action: () => onSelectTab('analytics')
    }
  )

  // 2. Servers
  for (const s of servers) {
    allItems.push({
      id: `srv_${s.id}`,
      title: s.name,
      subtitle: `Switch active server (${s.transport}) — ${s.status}`,
      category: 'Servers',
      icon: <Server className="w-4 h-4 text-indigo-400" />,
      action: () => {
        onSelectServer(s.id)
        onSelectTab('tools')
      }
    })
  }

  // 3. Tools from connected servers
  for (const [srvId, meta] of Object.entries(serverMetadataMap)) {
    const srv = servers.find((s) => s.id === srvId)
    if (meta.tools) {
      for (const t of meta.tools) {
        allItems.push({
          id: `tool_${srvId}_${t.name}`,
          title: t.name,
          subtitle: `${srv?.name || 'Server'} • ${t.description || 'No description'}`,
          category: 'Tools',
          icon: <Layers className="w-4 h-4 text-cyan-400" />,
          action: () => {
            onSelectServer(srvId)
            onSelectTab('tools')
          }
        })
      }
    }
  }

  const filteredItems = allItems.filter((item) => {
    if (!query.trim()) return true
    const q = query.toLowerCase().trim()
    const terms = q.split(/\s+/)
    const fullText = `${item.title} ${item.subtitle} ${item.category}`.toLowerCase()
    return terms.every((term) => fullText.includes(term))
  })

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-60 bg-black/75 backdrop-blur-md flex items-start justify-center pt-[12vh] p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-studio-900 border border-studio-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]"
      >
        {/* Search Input Bar */}
        <div className="px-5 py-4 border-b border-studio-border bg-studio-950/80 flex items-center gap-3">
          <Search className="w-5 h-5 text-indigo-400 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            placeholder="Type a tool name, server, action, or command... (e.g. 'tests', 'postgres', 'lint')"
            autoFocus
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 bg-studio-900 px-2 py-1 rounded border border-studio-border">
            <span>ESC</span>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No matching tools, servers, or commands found for "{query}".
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.action()
                    onClose()
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-3.5 py-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'hover:bg-studio-850 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-indigo-700 text-white' : 'bg-studio-950 text-slate-400 border border-studio-border'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-semibold truncate flex items-center gap-2">
                        <span>{item.title}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-mono uppercase ${
                            isSelected
                              ? 'bg-indigo-700/60 text-indigo-200'
                              : 'bg-studio-950 text-slate-500 border border-studio-border/60'
                          }`}
                        >
                          {item.category}
                        </span>
                      </div>
                      <div
                        className={`text-[11px] truncate mt-0.5 ${
                          isSelected ? 'text-indigo-200' : 'text-slate-500'
                        }`}
                      >
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <ArrowRight
                    className={`w-4 h-4 flex-shrink-0 ml-2 transition-transform ${
                      isSelected ? 'translate-x-0.5 opacity-100' : 'opacity-0'
                    }`}
                  />
                </div>
              )
            })
          )}
        </div>

        {/* Footer Shortcut Tips */}
        <div className="px-5 py-2.5 border-t border-studio-border bg-studio-950 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="bg-studio-900 border border-studio-border px-1.5 py-0.5 rounded text-[10px]">↑</kbd>{' '}
              <kbd className="bg-studio-900 border border-studio-border px-1.5 py-0.5 rounded text-[10px]">↓</kbd> to navigate
            </span>
            <span>
              <kbd className="bg-studio-900 border border-studio-border px-1.5 py-0.5 rounded text-[10px]">↵</kbd> to select
            </span>
          </div>
          <span>Command Palette</span>
        </div>
      </div>
    </div>
  )
}
