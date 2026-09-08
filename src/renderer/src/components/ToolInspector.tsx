import React, { useState, useEffect, useRef } from 'react'
import {
  Layers,
  Play,
  Check,
  Code2,
  Sliders,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Bookmark,
  Sparkles,
  Save,
  ShieldCheck,
  Wand2,
  Dices,
  ChevronDown,
  Trash2,
  Square,
  Loader2,
  Power
} from 'lucide-react'
import { McpTool, SavedRequest, RequestCollection, McpServerConfig } from '../../../shared/types'
import { ResponseVisualizer } from './ResponseVisualizer'
import { CodeSnippetsModal } from './CodeSnippetsModal'
import { SchemaLinterModal } from './SchemaLinterModal'
import { SchemaOptimizerModal } from './SchemaOptimizerModal'
import { BatchToolsModal } from './BatchToolsModal'
import { ToolListSidebar } from './ToolListSidebar'
import { Modal } from './Modal'
import { generateMockDataForSchema } from '../utils/mockDataGenerator'
import { playSuccessSound } from '../utils/soundEngine'

interface ToolInspectorProps {
  tools: McpTool[]
  server?: McpServerConfig
  serverId: string
  serverName: string
  serverStatus?: 'connected' | 'connecting' | 'disconnected' | 'error'
  loadedRequest?: SavedRequest | null
  onExecuteTool: (toolName: string, args: Record<string, any>) => Promise<{
    success: boolean
    result?: any
    durationMs?: number
    error?: string
  }>
  onOpenCollections: () => void
  onConnectServer?: (server: McpServerConfig) => void
}

export const ToolInspector: React.FC<ToolInspectorProps> = ({
  tools,
  server,
  serverId,
  serverName,
  serverStatus,
  loadedRequest,
  onExecuteTool,
  onOpenCollections,
  onConnectServer
}) => {
  const [selectedToolName, setSelectedToolName] = useState<string>(tools[0]?.name || '')
  const [searchQuery, setSearchQuery] = useState('')
  const effectiveStatus = serverStatus || server?.status
  const isServerRunning = effectiveStatus === 'connected'
  const isServerConnecting = effectiveStatus === 'connecting'
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [toolFormsCache, setToolFormsCache] = useState<Record<string, Record<string, any>>>({})
  const [rawJsonMode, setRawJsonMode] = useState(false)
  const [rawJsonString, setRawJsonString] = useState('{}')
  const [isLoading, setIsLoading] = useState(false)
  const [lastResult, setLastResult] = useState<{
    success: boolean
    result?: any
    durationMs?: number
    error?: string
  } | null>(null)
  const [toolResultsCache, setToolResultsCache] = useState<
    Record<
      string,
      {
        success: boolean
        result?: any
        durationMs?: number
        error?: string
      }
    >
  >({})
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false)
  const [isAutoFillMenuOpen, setIsAutoFillMenuOpen] = useState(false)
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false)
  const actionsMenuRef = useRef<HTMLDivElement>(null)
  const autoFillMenuRef = useRef<HTMLDivElement>(null)

  // Reset tool results when switching servers
  useEffect(() => {
    setToolResultsCache({})
    setLastResult(null)
  }, [serverId])

  // Load cached form inputs for this server
  useEffect(() => {
    if (!serverId) return
    try {
      const stored = localStorage.getItem(`mcp_studio_form_cache_${serverId}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        setToolFormsCache(parsed)
        const currentToolCached = parsed[selectedToolName]
        if (currentToolCached) {
          setFormValues(currentToolCached)
          setRawJsonString(JSON.stringify(currentToolCached, null, 2))
        }
      }
    } catch (e) {
      console.error('Failed to load tool forms cache:', e)
    }
  }, [serverId])

  // Persist tool forms cache when changed
  useEffect(() => {
    if (!serverId || Object.keys(toolFormsCache).length === 0) return
    try {
      localStorage.setItem(`mcp_studio_form_cache_${serverId}`, JSON.stringify(toolFormsCache))
    } catch (e) {
      console.error('Failed to save tool forms cache:', e)
    }
  }, [toolFormsCache, serverId])

  // Click outside to close utilities & autofill dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(e.target as Node)) {
        setIsActionsMenuOpen(false)
      }
      if (autoFillMenuRef.current && !autoFillMenuRef.current.contains(e.target as Node)) {
        setIsAutoFillMenuOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsActionsMenuOpen(false)
        setIsAutoFillMenuOpen(false)
      }
    }

    if (isActionsMenuOpen || isAutoFillMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActionsMenuOpen, isAutoFillMenuOpen])

  // Save Request Modal
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false)
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false)
  const [isLintModalOpen, setIsLintModalOpen] = useState(false)
  const [isOptimizerModalOpen, setIsOptimizerModalOpen] = useState(false)
  const [requestName, setRequestName] = useState('')
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('')
  const [collections, setCollections] = useState<RequestCollection[]>([])

  // Global Ctrl+Enter shortcut to execute tool
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleExecute()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedToolName, formValues, rawJsonMode, rawJsonString])
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Sync loaded request if passed
  useEffect(() => {
    if (loadedRequest) {
      setSelectedToolName(loadedRequest.toolName)
      const args = loadedRequest.arguments || {}
      setFormValues(args)
      setRawJsonString(JSON.stringify(args, null, 2))
      setToolFormsCache((prev) => ({
        ...prev,
        [loadedRequest.toolName]: args
      }))
    }
  }, [loadedRequest])

  const activeTool = tools.find((t) => t.name === selectedToolName) || tools[0]

  const handleSelectTool = (tool: McpTool) => {
    if (activeTool) {
      setToolFormsCache((prev) => ({
        ...prev,
        [activeTool.name]: formValues
      }))
    }
    setSelectedToolName(tool.name)
    const cached = toolFormsCache[tool.name] || {}
    setFormValues(cached)
    setRawJsonString(JSON.stringify(cached, null, 2))
    
    // Restore the individual execution result for this tool (if previously executed)
    const cachedResult = toolResultsCache[tool.name] || null
    setLastResult(cachedResult)
  }

  const handleFormValueChange = (propName: string, val: any) => {
    const updated = { ...formValues, [propName]: val }
    setFormValues(updated)
    setRawJsonString(JSON.stringify(updated, null, 2))
    if (activeTool) {
      setToolFormsCache((prev) => ({
        ...prev,
        [activeTool.name]: updated
      }))
    }
  }

  const handleRawJsonChange = (newJson: string) => {
    setRawJsonString(newJson)
    try {
      const parsed = JSON.parse(newJson)
      setFormValues(parsed)
      if (activeTool) {
        setToolFormsCache((prev) => ({
          ...prev,
          [activeTool.name]: parsed
        }))
      }
    } catch {
      // Ignore JSON parse errors while mid-typing
    }
  }

  const handleClearCurrentForm = () => {
    setFormValues({})
    setRawJsonString('{}')
    if (activeTool) {
      setToolFormsCache((prev) => {
        const next = { ...prev }
        delete next[activeTool.name]
        return next
      })
      if (serverId) {
        try {
          const stored = localStorage.getItem(`mcp_studio_form_cache_${serverId}`)
          if (stored) {
            const parsed = JSON.parse(stored)
            delete parsed[activeTool.name]
            localStorage.setItem(`mcp_studio_form_cache_${serverId}`, JSON.stringify(parsed))
          }
        } catch (e) {
          console.error(e)
        }
      }
    }
    playSuccessSound()
  }

  const handleClearSelectedTools = (toolNames: string[]) => {
    setToolFormsCache((prev) => {
      const next = { ...prev }
      toolNames.forEach((n) => delete next[n])
      return next
    })
    if (activeTool && toolNames.includes(activeTool.name)) {
      setFormValues({})
      setRawJsonString('{}')
    }
    if (serverId) {
      try {
        const stored = localStorage.getItem(`mcp_studio_form_cache_${serverId}`)
        if (stored) {
          const parsed = JSON.parse(stored)
          toolNames.forEach((n) => delete parsed[n])
          localStorage.setItem(`mcp_studio_form_cache_${serverId}`, JSON.stringify(parsed))
        }
      } catch (e) {
        console.error(e)
      }
    }
  }

  const abortRef = useRef(false)

  const handleExecute = async () => {
    if (!activeTool) return
    abortRef.current = false
    setIsLoading(true)
    setLastResult(null)

    let payload = { ...formValues }
    if (rawJsonMode) {
      try {
        payload = JSON.parse(rawJsonString)
      } catch (err: any) {
        setIsLoading(false)
        setLastResult({
          success: false,
          error: `Invalid JSON syntax: ${err.message}`
        })
        return
      }
    } else {
      // Auto-parse stringified objects/arrays and remove broken object string tags
      for (const [key, val] of Object.entries(payload)) {
        if (typeof val === 'string') {
          const trimmed = val.trim()
          if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
            try {
              payload[key] = JSON.parse(trimmed)
            } catch {
              // keep raw string if invalid JSON
            }
          } else if (trimmed === '[object Object]') {
            delete payload[key]
          }
        }
      }
    }

    try {
      const res = await onExecuteTool(activeTool.name, payload)
      if (!abortRef.current) {
        setLastResult(res)
        setToolResultsCache((prev) => ({
          ...prev,
          [activeTool.name]: res
        }))
        setIsLoading(false)
      }
    } catch (err: any) {
      if (!abortRef.current) {
        const errResult = {
          success: false,
          error: err?.message || 'Execution error'
        }
        setLastResult(errResult)
        setToolResultsCache((prev) => ({
          ...prev,
          [activeTool.name]: errResult
        }))
        setIsLoading(false)
      }
    }
  }

  const handleStopExecution = () => {
    if (!activeTool) return
    abortRef.current = true
    setIsLoading(false)
    const cancelledResult = {
      success: false,
      error: 'Tool execution cancelled by user.'
    }
    setLastResult(cancelledResult)
    setToolResultsCache((prev) => ({
      ...prev,
      [activeTool.name]: cancelledResult
    }))
  }

  const handleOpenSaveModal = async () => {
    const list = await window.api.storage.getCollections()
    setCollections(list)
    setRequestName(`${activeTool?.name || 'Tool'} Call`)
    setIsSaveModalOpen(true)
  }

  const handleConfirmSave = async () => {
    if (!requestName.trim() || !activeTool) return

    let payload = formValues
    if (rawJsonMode) {
      try {
        payload = JSON.parse(rawJsonString)
      } catch {
        payload = {}
      }
    }

    const newSaved: SavedRequest = {
      id: 'req_' + crypto.randomUUID(),
      name: requestName.trim(),
      serverId,
      serverName,
      toolName: activeTool.name,
      arguments: payload,
      collectionId: selectedCollectionId || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    await window.api.storage.saveRequest(newSaved)
    setSaveSuccess(true)
    setTimeout(() => {
      setSaveSuccess(false)
      setIsSaveModalOpen(false)
    }, 1200)
  }

  if (server?.status === 'disconnected' || !server) {
    return (
      <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-8 text-center bg-studio-950 overflow-y-auto">
        <div className="max-w-lg mx-auto space-y-4 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10 animate-pulse">
            <Power className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Server Offline ({server?.name || 'Selected Server'})</span>
            </div>
            <h4 className="font-extrabold text-white text-base">MCP Server Must Be Started</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              The Tool Inspector requires an active MCP server connection to inspect JSON schemas, auto-fill mock data, and execute live tools. Start <strong className="text-slate-200 font-mono">{server?.name || 'the server'}</strong> to load its tools.
            </p>
          </div>

          {server && onConnectServer && (
            <button
              type="button"
              onClick={() => onConnectServer(server)}
              disabled={isServerConnecting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isServerConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Starting Server...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start "{server.name}" Server</span>
                </>
              )}
            </button>
          )}

          <div className="pt-3 border-t border-studio-border/60 w-full text-left space-y-2 bg-studio-900/30 p-3.5 rounded-xl border border-studio-border text-[11px] text-slate-400">
            <div className="font-bold text-slate-300">Tool Inspector Workflow:</div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-studio-800 border border-studio-border flex items-center justify-center text-[10px] font-bold text-slate-300 shrink-0">1</span>
              <span>Click <strong>Start Server</strong> above (or the Play button ▷ in the left sidebar).</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-studio-800 border border-studio-border flex items-center justify-center text-[10px] font-bold text-slate-300 shrink-0">2</span>
              <span>Tools and parameters automatically load in the left list.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-studio-800 border border-studio-border flex items-center justify-center text-[10px] font-bold text-slate-300 shrink-0">3</span>
              <span>Configure arguments, auto-fill mock data, and hit <strong>Execute Tool</strong>!</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (server?.status === 'connecting') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-studio-950">
        <div className="w-16 h-16 rounded-2xl bg-studio-900 border border-amber-500/30 flex items-center justify-center mb-4 shadow-xl shadow-amber-500/10">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        </div>
        <h3 className="text-base font-extrabold text-slate-100">
          Starting {server.name}...
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed font-medium">
          Spawning the MCP server subprocess and negotiating tools over JSON-RPC protocol...
        </p>
      </div>
    )
  }

  if (tools.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-studio-950">
        <Layers className="w-12 h-12 text-slate-400 dark:text-slate-700 mb-3" />
        <h3 className="text-sm font-semibold text-slate-300">No Tools Exposed</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          This MCP server is connected, but does not currently declare any tool capabilities.
        </p>
      </div>
    )
  }

  const handleAutoFillMockData = () => {
    if (!activeTool?.inputSchema) return
    const mock = generateMockDataForSchema(activeTool.inputSchema)
    setFormValues(mock)
    setRawJsonString(JSON.stringify(mock, null, 2))
    setToolFormsCache((prev) => ({
      ...prev,
      [activeTool.name]: mock
    }))
    playSuccessSound()
  }

  const handleAutoFillAllTools = () => {
    const mockMap: Record<string, Record<string, any>> = {}
    tools.forEach((t) => {
      mockMap[t.name] = generateMockDataForSchema(t.inputSchema)
    })
    setToolFormsCache((prev) => ({ ...prev, ...mockMap }))
    const activeMock = activeTool ? mockMap[activeTool.name] : undefined
    if (activeMock) {
      setFormValues(activeMock)
      setRawJsonString(JSON.stringify(activeMock, null, 2))
    }
    setIsAutoFillMenuOpen(false)
    playSuccessSound()
  }

  const handleBatchAutoFillComplete = (mockMap: Record<string, Record<string, any>>) => {
    setToolFormsCache((prev) => ({ ...prev, ...mockMap }))
    const activeMock = activeTool ? mockMap[activeTool.name] : undefined
    if (activeMock) {
      setFormValues(activeMock)
      setRawJsonString(JSON.stringify(activeMock, null, 2))
    }
  }

  return (
    <div className="flex-1 flex overflow-hidden bg-studio-950">
      {/* Left Column: Tool List Sidebar */}
      <ToolListSidebar
        tools={tools}
        activeTool={activeTool || null}
        server={server}
        serverName={serverName}
        isServerRunning={isServerRunning}
        isServerConnecting={isServerConnecting}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectTool={handleSelectTool}
        onOpenBatchModal={() => setIsBatchModalOpen(true)}
        onOpenCollections={onOpenCollections}
        onConnectServer={onConnectServer}
        toolResultsCache={toolResultsCache}
      />

      {/* Right Column: Execution & Form */}
      {activeTool ? (
        <div className="flex-1 flex flex-col overflow-hidden bg-studio-900/30">
          {/* Tool Header */}
          <div className="p-5 border-b border-studio-border flex items-start justify-between bg-studio-950/40">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-black text-white">
                  {activeTool.name}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-mono font-bold">
                  tool
                </span>
              </div>
              {activeTool.description && (
                <p className="text-xs text-slate-400 mt-1 max-w-2xl font-medium">{activeTool.description}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* 1. Quick Faker Split Button */}
              <div className="relative inline-flex rounded-lg shadow-sm" ref={autoFillMenuRef}>
                <button
                  onClick={handleAutoFillMockData}
                  className="px-3 py-1.5 rounded-l-lg border border-r-0 border-indigo-300 dark:border-indigo-800/50 bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-xs font-semibold text-indigo-300 flex items-center gap-1.5 transition-colors"
                  title="Auto-fill current tool with realistic demo arguments"
                >
                  <Dices className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Auto-Fill</span>
                </button>
                <button
                  onClick={() => setIsAutoFillMenuOpen(!isAutoFillMenuOpen)}
                  className="px-1.5 py-1.5 rounded-r-lg border border-indigo-300 dark:border-indigo-800/50 bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-xs font-semibold text-indigo-300 flex items-center transition-colors"
                  title="Auto-Fill Options (Single / All / Batch)"
                >
                  <ChevronDown className="w-3 h-3 text-indigo-400" />
                </button>

                {isAutoFillMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-60 bg-studio-900 border border-studio-border rounded-xl shadow-2xl p-1.5 space-y-1 z-50 animate-in fade-in zoom-in-95">
                    <button
                      onClick={() => {
                        setIsAutoFillMenuOpen(false)
                        handleAutoFillMockData()
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-studio-800 text-xs text-slate-200 hover:text-white flex items-center justify-between transition-colors font-medium"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Dices className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">Fill &quot;{activeTool.name}&quot;</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">Current</span>
                    </button>

                    <button
                      onClick={handleAutoFillAllTools}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-studio-800 text-xs text-slate-200 hover:text-white flex items-center justify-between transition-colors font-medium"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span>Auto-Fill All Tools</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-300 font-bold">
                        {tools.length}
                      </span>
                    </button>

                    <div className="my-1 border-t border-studio-border" />

                    <button
                      onClick={() => {
                        setIsAutoFillMenuOpen(false)
                        setIsBatchModalOpen(true)
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-studio-800 text-xs text-slate-200 hover:text-white flex items-center justify-between transition-colors font-medium"
                    >
                      <div className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>Select Tools & Run...</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">Custom</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 2. Secondary Utilities Dropdown */}
              <div className="relative" ref={actionsMenuRef}>
                <button
                  onClick={() => setIsActionsMenuOpen(!isActionsMenuOpen)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    isActionsMenuOpen
                      ? 'bg-indigo-500/10 border-indigo-500 text-indigo-700 dark:text-white'
                      : 'bg-studio-900 hover:bg-studio-850 border-studio-border text-slate-300'
                  }`}
                  title="Specialized Tool Utilities"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden sm:inline">Utilities</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {isActionsMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-56 bg-studio-900 border border-studio-border rounded-xl shadow-2xl p-1.5 space-y-1 z-50 animate-in fade-in zoom-in-95">
                    <button
                      onClick={() => { setIsActionsMenuOpen(false); setIsOptimizerModalOpen(true) }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-studio-800 text-xs text-slate-200 hover:text-white flex items-center gap-2 transition-colors font-medium"
                    >
                      <Wand2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>Optimize for AI</span>
                    </button>
                    <button
                      onClick={() => { setIsActionsMenuOpen(false); setIsLintModalOpen(true) }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-studio-800 text-xs text-slate-200 hover:text-white flex items-center gap-2 transition-colors font-medium"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Audit & Lint Schema</span>
                    </button>
                    <button
                      onClick={() => { setIsActionsMenuOpen(false); setIsCodeModalOpen(true) }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-studio-800 text-xs text-slate-200 hover:text-white flex items-center gap-2 transition-colors font-medium"
                    >
                      <Code2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Client Code (5 Langs)</span>
                    </button>
                    <button
                      onClick={() => { setIsActionsMenuOpen(false); handleOpenSaveModal() }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-studio-800 text-xs text-slate-200 hover:text-white flex items-center gap-2 transition-colors font-medium"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>Save Request</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 3. Form / Raw JSON Toggle */}
              <div className="flex bg-studio-950 p-0.5 rounded-lg border border-studio-border text-xs">
                <button
                  onClick={() => setRawJsonMode(false)}
                  className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                    !rawJsonMode ? 'bg-studio-800 text-white font-bold shadow-sm' : 'text-slate-500 hover:text-slate-200'
                  }`}
                >
                  <Sliders className="w-3 h-3" />
                  <span className="hidden md:inline">Form</span>
                </button>
                <button
                  onClick={() => {
                    setRawJsonMode(true)
                    setRawJsonString(JSON.stringify(formValues, null, 2))
                  }}
                  className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                    rawJsonMode ? 'bg-studio-800 text-white font-bold shadow-sm' : 'text-slate-500 hover:text-slate-200'
                  }`}
                >
                  <Code2 className="w-3 h-3" />
                  <span className="hidden md:inline">JSON</span>
                </button>
              </div>

              {/* 4. Hero Execute / Stop Button Group */}
              <div className="flex items-center gap-1.5">
                {isLoading ? (
                  <>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-studio-900 border border-amber-500/40 text-amber-400 text-xs font-bold shadow-sm animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      <span>Running...</span>
                    </div>

                    <button
                      onClick={handleStopExecution}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold shadow-lg shadow-rose-600/40 flex items-center gap-1.5 transition-all cursor-pointer animate-in fade-in zoom-in-95"
                      title="Cancel and stop tool execution immediately"
                    >
                      <Square className="w-3.5 h-3.5 fill-current text-white" />
                      <span>Stop</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleExecute}
                    className="execute-btn px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 text-white" />
                    <span className="text-white">Execute</span>
                    <span className="hidden lg:inline text-[9px] font-mono text-white/90 bg-black/20 px-1 rounded">↵</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Form & Response Split */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-studio-border overflow-hidden">
            {/* Input Side */}
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <span>Tool Parameters</span>
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClearCurrentForm}
                    className="text-[11px] font-medium text-slate-500 hover:text-rose-400 flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-studio-800"
                    title="Clear all parameter inputs for this tool"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear Inputs</span>
                  </button>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Supports <code className="text-cyan-400">{'{{ENV_VAR}}'}</code>
                  </span>
                </div>
              </div>

              {rawJsonMode ? (
                <div className="space-y-2">
                  <textarea
                    value={rawJsonString}
                    onChange={(e) => handleRawJsonChange(e.target.value)}
                    rows={14}
                    className="w-full bg-studio-950 border border-studio-border rounded-xl p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed shadow-sm"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(activeTool.inputSchema?.properties || {}).length === 0 ? (
                    <div className="p-4 rounded-xl border border-studio-border bg-studio-950/40 text-xs text-slate-500 text-center">
                      This tool accepts no arguments.
                    </div>
                  ) : (
                    Object.entries(activeTool.inputSchema?.properties || {}).map(([propName, propDef]: [string, any]) => {
                      const isRequired = (activeTool.inputSchema?.required || []).includes(propName)
                      return (
                        <div key={propName} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1">
                              <span>{propName}</span>
                              {isRequired && <span className="text-rose-500 dark:text-rose-400">*</span>}
                            </label>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{propDef.type || 'any'}</span>
                          </div>

                          {propDef.description && (
                            <p className="text-[11px] text-slate-400 leading-snug">{propDef.description}</p>
                          )}

                          {propDef.type === 'boolean' ? (
                            <select
                              value={formValues[propName] === undefined ? '' : String(formValues[propName])}
                              onChange={(e) => {
                                const val = e.target.value === '' ? undefined : e.target.value === 'true'
                                handleFormValueChange(propName, val)
                              }}
                              className="w-full bg-studio-950 border border-studio-border rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 shadow-sm font-medium"
                            >
                              <option value="">(Not specified)</option>
                              <option value="true">true</option>
                              <option value="false">false</option>
                            </select>
                          ) : propDef.type === 'object' || propDef.type === 'array' ? (
                            <div className="space-y-1">
                              <textarea
                                rows={4}
                                placeholder={propDef.type === 'object' ? '{\n  "key": "value"\n}' : '[\n  "item1", "item2"\n]'}
                                value={
                                  typeof formValues[propName] === 'object' && formValues[propName] !== null
                                    ? JSON.stringify(formValues[propName], null, 2)
                                    : (formValues[propName] ?? '')
                                }
                                onChange={(e) => {
                                  const raw = e.target.value
                                  try {
                                    const parsed = JSON.parse(raw)
                                    handleFormValueChange(propName, parsed)
                                  } catch {
                                    handleFormValueChange(propName, raw)
                                  }
                                }}
                                className="w-full bg-studio-950 border border-studio-border rounded-lg p-2.5 text-xs font-mono text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-indigo-500 shadow-sm leading-relaxed"
                              />
                            </div>
                          ) : (
                            <input
                              type={propDef.type === 'number' || propDef.type === 'integer' ? 'number' : 'text'}
                              placeholder={`Enter ${propName}...`}
                              value={
                                typeof formValues[propName] === 'object' && formValues[propName] !== null
                                  ? JSON.stringify(formValues[propName])
                                  : (formValues[propName] ?? '')
                              }
                              onChange={(e) => {
                                const val =
                                  propDef.type === 'number' || propDef.type === 'integer'
                                    ? e.target.value === ''
                                      ? undefined
                                      : Number(e.target.value)
                                    : e.target.value
                                handleFormValueChange(propName, val)
                              }}
                              className="w-full bg-studio-950 border border-studio-border rounded-lg px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-indigo-500 shadow-sm font-medium"
                            />
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>

            {/* Output Side */}
            <div className="p-5 overflow-y-auto flex flex-col justify-between bg-studio-950/20">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Response Payload</h4>
                    {lastResult && (
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 ${
                          lastResult.success
                            ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-400 border-emerald-800/40'
                            : 'bg-rose-100 dark:bg-rose-950/50 text-rose-400 border-rose-800/40'
                        }`}
                      >
                        {lastResult.success ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        <span>{lastResult.success ? '200 OK' : 'Error'}</span>
                      </span>
                    )}
                  </div>

                  {lastResult?.durationMs !== undefined && (
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                      <span>{lastResult.durationMs}ms</span>
                    </span>
                  )}
                </div>

                {lastResult ? (
                  <div className="h-[calc(100vh-280px)]">
                    <ResponseVisualizer
                      data={lastResult.result || lastResult.error}
                      durationMs={lastResult.durationMs}
                      isError={!lastResult.success}
                    />
                  </div>
                ) : (
                  <div className="h-64 border border-dashed border-studio-border rounded-xl flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500 text-xs">
                    <Sparkles className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                    <span>Run the tool to inspect real-time JSON-RPC return payloads.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : !isServerRunning ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-studio-950 max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10 animate-pulse">
            <Power className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Server Offline ({serverName || 'Selected Server'})</span>
            </div>
            <h4 className="font-extrabold text-white text-base">MCP Server Must Be Started</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              The Tool Inspector requires an active MCP connection to inspect schemas, execute tools, auto-fill mock data, and test JSON responses. Start <strong className="text-slate-200 font-mono">{serverName || 'the server'}</strong> to begin testing.
            </p>
          </div>

          {onConnectServer && (
            <button
              type="button"
              onClick={() => onConnectServer(server)}
              disabled={isServerConnecting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isServerConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Starting Server...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start "{serverName || 'MCP Server'}" Server</span>
                </>
              )}
            </button>
          )}

          <div className="pt-3 border-t border-studio-border/60 w-full text-left space-y-2 bg-studio-900/30 p-3.5 rounded-xl border border-studio-border text-[11px] text-slate-400">
            <div className="font-bold text-slate-300">Tool Inspector Workflow:</div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-studio-800 border border-studio-border flex items-center justify-center text-[10px] font-bold text-slate-300 shrink-0">1</span>
              <span>Click <strong>Start Server</strong> above (or the Play button ▷ in the left sidebar).</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-studio-800 border border-studio-border flex items-center justify-center text-[10px] font-bold text-slate-300 shrink-0">2</span>
              <span>Tools and parameters automatically load in the left list.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-studio-800 border border-studio-border flex items-center justify-center text-[10px] font-bold text-slate-300 shrink-0">3</span>
              <span>Fill arguments, use Auto-Fill or Batch Runner, and press <strong>Execute Tool</strong>.</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 dark:text-slate-500 space-y-2">
          <Layers className="w-10 h-10 opacity-30" />
          <p className="text-xs font-semibold text-slate-300">Select a Tool to Inspect</p>
          <p className="text-[11px] text-slate-500 max-w-xs">
            Choose a tool from the left list to view arguments, auto-fill mock data, and test executions.
          </p>
        </div>
      )}

      {/* Save Request Modal */}
      {/* Save Request Modal */}
      <Modal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        maxWidth="max-w-md"
        title={
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-indigo-400" />
            <span>Save Request to Collection</span>
          </div>
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsSaveModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-studio-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmSave}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-colors"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Request</span>
                </>
              )}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Request Name</label>
            <input
              type="text"
              value={requestName}
              onChange={(e) => setRequestName(e.target.value)}
              className="w-full bg-studio-950 border border-studio-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              placeholder="e.g. Fetch Active Users"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Select Collection (Optional)</label>
            <select
              value={selectedCollectionId}
              onChange={(e) => setSelectedCollectionId(e.target.value)}
              className="w-full bg-studio-950 border border-studio-border rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Standalone (No Collection)</option>
              {collections.map((col) => (
                <option key={col.id} value={col.id}>
                  📁 {col.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      {/* Code Snippet Modal (5 Languages) */}
      <CodeSnippetsModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        server={server}
        tool={activeTool}
        currentArgs={rawJsonMode ? (() => { try { return JSON.parse(rawJsonString) } catch { return {} } })() : formValues}
      />

      {/* Schema Linter Modal */}
      <SchemaLinterModal
        isOpen={isLintModalOpen}
        onClose={() => setIsLintModalOpen(false)}
        tool={activeTool}
      />

      {/* AI Schema & Prompt Optimizer Modal */}
      <SchemaOptimizerModal
        isOpen={isOptimizerModalOpen}
        onClose={() => setIsOptimizerModalOpen(false)}
        tool={activeTool || null}
        serverName={serverName}
      />

      {/* Batch Tools & Smoke Test Modal */}
      <BatchToolsModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        tools={tools}
        serverName={serverName}
        toolFormsCache={toolFormsCache}
        onAutoFillSelected={handleBatchAutoFillComplete}
        onClearSelected={handleClearSelectedTools}
        onExecuteTool={onExecuteTool}
        onSelectToolAndClose={(toolName) => {
          const tool = tools.find((t) => t.name === toolName)
          if (tool) handleSelectTool(tool)
          setIsBatchModalOpen(false)
        }}
      />
    </div>
  )
}
