import React, { useState, useEffect } from 'react'
import {
  X,
  Dices,
  Play,
  CheckCircle2,
  AlertCircle,
  Search,
  CheckSquare,
  Square,
  RotateCcw,
  Trash2
} from 'lucide-react'
import { McpTool } from '../../../shared/types'
import { generateMockDataForSchema } from '../utils/mockDataGenerator'
import { playSuccessSound } from '../utils/soundEngine'

interface BatchToolsModalProps {
  isOpen: boolean
  onClose: () => void
  tools: McpTool[]
  serverName: string
  toolFormsCache: Record<string, Record<string, any>>
  onAutoFillSelected: (mockDataMap: Record<string, Record<string, any>>) => void
  onClearSelected: (toolNames: string[]) => void
  onExecuteTool: (toolName: string, args: Record<string, any>) => Promise<{
    success: boolean
    result?: any
    durationMs?: number
    error?: string
  }>
  onSelectToolAndClose: (toolName: string) => void
}

interface SmokeResult {
  status: 'idle' | 'running' | 'success' | 'error'
  durationMs?: number
  error?: string
}

export const BatchToolsModal: React.FC<BatchToolsModalProps> = ({
  isOpen,
  onClose,
  tools,
  serverName,
  toolFormsCache,
  onAutoFillSelected,
  onClearSelected,
  onExecuteTool,
  onSelectToolAndClose
}) => {
  const [selectedTools, setSelectedTools] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<Record<string, SmokeResult>>({})

  useEffect(() => {
    if (isOpen) {
      setSelectedTools(tools.map((t) => t.name))
      setResults({})
      setIsRunning(false)
    }
  }, [isOpen, tools])

  if (!isOpen) return null

  const filteredTools = tools.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleSelectTool = (name: string) => {
    setSelectedTools((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    )
  }

  const handleSelectAll = () => {
    setSelectedTools(tools.map((t) => t.name))
  }

  const handleDeselectAll = () => {
    setSelectedTools([])
  }

  const handleAutoFillSelected = () => {
    const mockMap: Record<string, Record<string, any>> = {}
    tools.forEach((t) => {
      if (selectedTools.includes(t.name)) {
        mockMap[t.name] = generateMockDataForSchema(t.inputSchema)
      }
    })
    onAutoFillSelected(mockMap)
    playSuccessSound()
  }

  const handleRunSmokeTest = async () => {
    if (selectedTools.length === 0 || isRunning) return
    setIsRunning(true)

    // Ensure selected tools have mock data in cache or generated on the fly
    const mockMap: Record<string, Record<string, any>> = {}
    tools.forEach((t) => {
      if (selectedTools.includes(t.name)) {
        mockMap[t.name] = toolFormsCache[t.name] || generateMockDataForSchema(t.inputSchema)
      }
    })
    onAutoFillSelected(mockMap)

    const initialResults: Record<string, SmokeResult> = {}
    selectedTools.forEach((name) => {
      initialResults[name] = { status: 'idle' }
    })
    setResults(initialResults)

    for (const toolName of selectedTools) {
      setResults((prev) => ({
        ...prev,
        [toolName]: { status: 'running' }
      }))

      const payload = mockMap[toolName] || {}
      try {
        const res = await onExecuteTool(toolName, payload)
        if (res.success) {
          setResults((prev) => ({
            ...prev,
            [toolName]: {
              status: 'success',
              durationMs: res.durationMs
            }
          }))
        } else {
          setResults((prev) => ({
            ...prev,
            [toolName]: {
              status: 'error',
              error: res.error || 'Execution failed'
            }
          }))
        }
      } catch (err: any) {
        setResults((prev) => ({
          ...prev,
          [toolName]: {
            status: 'error',
            error: err?.message || 'Execution error'
          }
        }))
      }
    }

    setIsRunning(false)
    playSuccessSound()
  }

  const passedCount = Object.values(results).filter((r) => r.status === 'success').length
  const failedCount = Object.values(results).filter((r) => r.status === 'error').length

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-studio-900 border border-studio-border rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col h-[82vh] animate-in fade-in zoom-in-95"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-studio-border bg-studio-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Dices className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="studio-brand-title">Batch Tool Auto-Fill & Runner</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-mono">
                  {serverName}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Select tools to auto-generate mock arguments or run a multi-tool smoke test.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="p-4 border-b border-studio-border bg-studio-950/40 flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tools by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-studio-900 border border-studio-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-studio-800 border border-studio-border"
            >
              Select All
            </button>
            <button
              onClick={handleDeselectAll}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-studio-800 border border-studio-border"
            >
              Deselect All
            </button>
          </div>
        </div>

        {/* Tools Selection List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/20 dark:bg-studio-950/20">
          {filteredTools.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No tools matching &quot;{searchQuery}&quot;
            </div>
          ) : (
            filteredTools.map((tool) => {
              const isSelected = selectedTools.includes(tool.name)
              const hasCachedMock = !!toolFormsCache[tool.name]
              const res = results[tool.name]

              return (
                <div
                  key={tool.name}
                  onClick={() => toggleSelectTool(tool.name)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-indigo-500/50 bg-indigo-500/5 dark:bg-indigo-950/20 shadow-sm'
                      : 'border-studio-border bg-studio-900/40 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="text-indigo-400 shrink-0">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white truncate">
                          {tool.name}
                        </span>
                        {hasCachedMock && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-emerald-100 dark:bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 font-bold shrink-0">
                            Filled
                          </span>
                        )}
                      </div>
                      {tool.description && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {tool.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status / Quick Action */}
                  <div className="flex items-center gap-2 shrink-0">
                    {res && res.status === 'running' && (
                      <span className="flex items-center gap-1 text-[11px] text-amber-500 font-medium animate-pulse">
                        <RotateCcw className="w-3 h-3 animate-spin" />
                        Running...
                      </span>
                    )}

                    {res && res.status === 'success' && (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {res.durationMs !== undefined ? `${res.durationMs}ms` : 'PASS'}
                      </span>
                    )}

                    {res && res.status === 'error' && (
                      <span
                        className="flex items-center gap-1 text-[11px] text-rose-400 font-bold bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/40 truncate max-w-[140px]"
                        title={res.error}
                      >
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        FAIL
                      </span>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectToolAndClose(tool.name)
                      }}
                      className="text-[10px] text-slate-400 hover:text-indigo-400 font-medium px-2 py-1 rounded hover:bg-studio-800"
                    >
                      Open in Inspector &rarr;
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer Summary & Actions */}
        <div className="px-6 py-4 border-t border-studio-border bg-studio-950/80 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-3">
            <span>
              Selected: <strong className="text-indigo-400">{selectedTools.length}</strong> / {tools.length}
            </span>
            {(passedCount > 0 || failedCount > 0) && (
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="text-emerald-400 font-bold">{passedCount} Passed</span>
                {failedCount > 0 && (
                  <span className="text-rose-400 font-bold">{failedCount} Failed</span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClearSelected(selectedTools)
                playSuccessSound()
              }}
              disabled={selectedTools.length === 0 || isRunning}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 border border-rose-800/40 disabled:opacity-50 flex items-center gap-1.5 transition-all"
              title="Clear input arguments for selected tools"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Inputs</span>
            </button>

            <button
              onClick={handleAutoFillSelected}
              disabled={selectedTools.length === 0 || isRunning}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-300 bg-indigo-100 dark:bg-indigo-500/20 hover:bg-indigo-200 dark:hover:bg-indigo-500/30 border border-indigo-500/30 disabled:opacity-50 flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Dices className="w-3.5 h-3.5" />
              <span>Auto-Fill Selected ({selectedTools.length})</span>
            </button>

            <button
              onClick={handleRunSmokeTest}
              disabled={selectedTools.length === 0 || isRunning}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-900/30 disabled:opacity-50 flex items-center gap-1.5 transition-all"
            >
              {isRunning ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  <span>Running Test...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Run Smoke Test</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
