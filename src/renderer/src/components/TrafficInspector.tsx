import React, { useState, useMemo } from 'react'
import {
  Activity,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Play,
  GitCompare,
  Sparkles
} from 'lucide-react'
import { JsonRpcLog } from '../../../shared/types'

interface TrafficInspectorProps {
  logs: JsonRpcLog[]
  onClearLogs: () => void
  onReplayTool?: (
    serverId: string,
    toolName: string,
    args: Record<string, any>,
    targetTab?: 'tools' | 'simulator'
  ) => void
}

export const TrafficInspector = React.memo<TrafficInspectorProps>(({
  logs,
  onClearLogs,
  onReplayTool
}) => {
  const [selectedLogId, setSelectedLogId] = useState<string | null>(logs[logs.length - 1]?.id || null)
  const [compareLogId, setCompareLogId] = useState<string | null>(null)
  const [isDiffMode, setIsDiffMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDirection, setFilterDirection] = useState<'all' | 'incoming' | 'outgoing'>('all')
  const [copied, setCopied] = useState(false)

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesDir = filterDirection === 'all' || log.direction === filterDirection
      const matchesSearch =
        searchQuery === '' ||
        (log.method || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.serverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        JSON.stringify(log.payload).toLowerCase().includes(searchQuery.toLowerCase())
      return matchesDir && matchesSearch
    })
  }, [logs, filterDirection, searchQuery])

  const selectedLog = logs.find((l) => l.id === selectedLogId) || filteredLogs[filteredLogs.length - 1]
  const compareLog = logs.find((l) => l.id === compareLogId)

  const handleCopy = () => {
    if (!selectedLog) return
    navigator.clipboard.writeText(JSON.stringify(selectedLog.payload, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleToggleDiffMode = () => {
    if (isDiffMode) {
      setIsDiffMode(false)
      setCompareLogId(null)
    } else {
      setIsDiffMode(true)
    }
  }

  const extractToolCallInfo = (log: JsonRpcLog | undefined): { toolName: string; args: Record<string, any> } => {
    if (!log) return { toolName: '', args: {} }
    const p = log.payload as any

    // Direct properties
    if (p?.name) {
      return {
        toolName: p.name,
        args: p.arguments || p.args || {}
      }
    }

    // Wrapped in params
    if (p?.params?.name) {
      return {
        toolName: p.params.name,
        args: p.params.arguments || p.params.args || {}
      }
    }

    // If incoming response packet or result, search backwards for matching request
    if (log.direction === 'incoming' || log.method?.includes('result') || log.method?.includes('error')) {
      const idx = logs.findIndex((l) => l.id === log.id)
      if (idx >= 0) {
        for (let i = idx - 1; i >= 0; i--) {
          const prev = logs[i]
          if (prev && prev.direction === 'outgoing' && prev.method?.startsWith('tools/call')) {
            const extracted = extractToolCallInfo(prev)
            if (extracted.toolName) return extracted
          }
        }
      }
    }

    return { toolName: '', args: {} }
  }

  const toolCallInfo = extractToolCallInfo(selectedLog)
  const isToolCall = !!toolCallInfo.toolName

  const handleReplay = (targetTab: 'tools' | 'simulator' = 'tools') => {
    if (!selectedLog || !onReplayTool || !toolCallInfo.toolName) return
    onReplayTool(selectedLog.serverId, toolCallInfo.toolName, toolCallInfo.args, targetTab)
  }

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-studio-950">
      {/* Log Feed List */}
      <div className="w-96 border-r border-studio-border bg-studio-900/30 flex flex-col h-full flex-shrink-0">
        <div className="p-3 border-b border-studio-border space-y-2 bg-studio-950/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Traffic Stream ({filteredLogs.length})
            </span>
            <button
              onClick={onClearLogs}
              className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-studio-800 transition-colors"
              title="Clear all logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search methods/payloads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-studio-950 border border-studio-border rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 shadow-sm font-medium"
              />
            </div>

            <select
              value={filterDirection}
              onChange={(e) => setFilterDirection(e.target.value as any)}
              className="bg-studio-950 border border-studio-border rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 shadow-sm font-medium"
            >
              <option value="all">All</option>
              <option value="incoming">In</option>
              <option value="outgoing">Out</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs font-medium">
              No JSON-RPC traffic recorded
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isSelected = log.id === (selectedLog?.id || selectedLogId)
              const isComparing = isDiffMode && log.id === compareLogId
              const isErr = log.isError || (log.payload as any)?.isError

              return (
                <div
                  key={log.id}
                  onClick={() => {
                    if (isDiffMode) {
                      setCompareLogId(log.id)
                    } else {
                      setSelectedLogId(log.id)
                    }
                  }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/10 dark:bg-cyan-600/15 border-cyan-500/50 shadow-sm'
                      : isComparing
                        ? 'bg-purple-500/10 dark:bg-purple-600/15 border-purple-500/50 shadow-sm'
                        : 'bg-transparent border-transparent hover:bg-studio-850 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {log.direction === 'outgoing' ? (
                        <ArrowUpRight className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      ) : (
                        <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      )}
                      <span className="text-xs font-mono font-bold truncate text-slate-200">
                        {log.method || 'response'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isErr && <AlertTriangle className="w-3 h-3 text-rose-500" />}
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="truncate max-w-[140px] font-medium text-slate-400">{log.serverName}</span>
                    {log.durationMs !== undefined && (
                      <span className="font-mono text-[10px] text-amber-400 font-bold">{log.durationMs}ms</span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Detail Pane */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-studio-900/30">
        {selectedLog ? (
          <>
            <div className="p-4 border-b border-studio-border bg-studio-900/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-extrabold text-white">
                  {selectedLog.method || 'JSON-RPC Payload'}
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    selectedLog.direction === 'outgoing'
                      ? 'bg-indigo-950/40 text-indigo-300 border-indigo-800'
                      : 'bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  }`}
                >
                  {selectedLog.direction}
                </span>
                {selectedLog.durationMs !== undefined && (
                  <span className="text-xs font-mono text-amber-400 font-bold ml-2">
                    {selectedLog.durationMs}ms
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isToolCall && onReplayTool && (
                  <>
                    <button
                      onClick={() => handleReplay('tools')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer"
                      title={`Replay "${toolCallInfo.toolName}" in Tool Inspector with arguments`}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Replay in Tools</span>
                    </button>

                    <button
                      onClick={() => handleReplay('simulator')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer"
                      title={`Send "${toolCallInfo.toolName}" task to AI Simulator`}
                    >
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>Send to Simulator</span>
                    </button>
                  </>
                )}

                <button
                  onClick={handleToggleDiffMode}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors shadow-sm ${
                    isDiffMode
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-studio-850 hover:bg-studio-800 border-studio-border text-slate-200'
                  }`}
                >
                  <GitCompare className="w-3 h-3" />
                  <span>{isDiffMode ? 'Comparing...' : 'Diff Tool'}</span>
                </button>

                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg border border-studio-border text-slate-300 hover:bg-studio-800 bg-studio-850 transition-colors shadow-sm"
                  title="Copy payload JSON"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Payloads View / Diff View */}
            <div className="flex-1 overflow-auto p-4 font-mono text-xs bg-studio-950/20">
              {isDiffMode && compareLog ? (
                <div className="grid grid-cols-2 gap-4 h-full">
                  <div className="border border-studio-border rounded-xl p-4 bg-studio-900/60 overflow-auto shadow-sm">
                    <div className="text-xs font-bold text-slate-400 mb-2">Base Packet ({selectedLog.id})</div>
                    <pre className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {JSON.stringify(selectedLog.payload, null, 2)}
                    </pre>
                  </div>
                  <div className="border border-purple-200 dark:border-purple-900/40 rounded-xl p-4 bg-purple-50/40 dark:bg-purple-950/20 overflow-auto shadow-sm">
                    <div className="text-xs font-bold text-purple-400 mb-2">Compare Packet ({compareLog.id})</div>
                    <pre className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {JSON.stringify(compareLog.payload, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="bg-studio-900 border border-studio-border rounded-2xl p-5 shadow-sm">
                  <pre className="text-slate-200 whitespace-pre-wrap leading-relaxed font-mono">
                    {JSON.stringify(selectedLog.payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 p-8">
            <Activity className="w-8 h-8 mb-2 opacity-40" />
            <p className="font-medium">Select a traffic log packet from the left stream to inspect.</p>
          </div>
        )}
      </div>
    </div>
  )
})

TrafficInspector.displayName = 'TrafficInspector'
