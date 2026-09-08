import React, { useState, useRef, useEffect } from 'react'
import {
  Terminal,
  ChevronUp,
  ChevronDown,
  Trash2,
  Search,
  AlertTriangle,
  Maximize2,
  Minimize2,
  ArrowDown
} from 'lucide-react'
import { ProcessConsoleLog } from '../../../shared/types'

interface ConsoleDrawerProps {
  logs: ProcessConsoleLog[]
  onClearLogs: () => void
  activeServerName?: string
}

export const ConsoleDrawer: React.FC<ConsoleDrawerProps> = ({
  logs,
  onClearLogs,
  activeServerName
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [filterStream, setFilterStream] = useState<'all' | 'stderr' | 'stdout'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [autoScroll, setAutoScroll] = useState(true)
  const logsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoScroll && isOpen) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, isOpen, autoScroll])

  const filteredLogs = logs.filter((l) => {
    if (filterStream !== 'all' && l.stream !== filterStream) return false
    if (searchQuery.trim()) {
      return l.message.toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

  const errorCount = logs.filter((l) => l.stream === 'stderr').length

  return (
    <div className="border-t border-studio-border bg-studio-950 flex flex-col z-30 flex-shrink-0">
      {/* Bottom Bar Header / Trigger */}
      <div
        className={`h-9 px-4 flex items-center justify-between bg-studio-950 text-xs select-none ${
          isOpen ? 'border-b border-studio-border' : ''
        }`}
      >
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white transition-colors"
        >
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-mono font-bold text-[11px]">Server Process Console</span>
          {activeServerName && (
            <span className="text-[10px] text-slate-500 font-mono">({activeServerName})</span>
          )}

          {errorCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
              <AlertTriangle className="w-2.5 h-2.5" />
              {errorCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isOpen && (
            <>
              {/* Stream Filters */}
              <div className="flex items-center bg-studio-900 rounded-lg p-0.5 border border-studio-border text-[10px]">
                <button
                  onClick={() => setFilterStream('all')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    filterStream === 'all'
                      ? 'bg-studio-800 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({logs.length})
                </button>
                <button
                  onClick={() => setFilterStream('stderr')}
                  className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                    filterStream === 'stderr'
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-300 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <AlertTriangle className="w-2.5 h-2.5 text-rose-500 dark:text-rose-400" />
                  <span>Stderr ({errorCount})</span>
                </button>
                <button
                  onClick={() => setFilterStream('stdout')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    filterStream === 'stdout'
                      ? 'bg-studio-800 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Stdout
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter console..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-studio-900 border border-studio-border rounded-md pl-6 pr-2 py-0.5 text-[11px] text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-32 shadow-sm font-medium"
                />
              </div>

              {/* Auto Scroll Toggle */}
              <button
                onClick={() => setAutoScroll(!autoScroll)}
                className={`p-1 rounded-md transition-colors ${
                  autoScroll ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
                title="Auto-scroll"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>

              {/* Clear */}
              <button
                onClick={onClearLogs}
                className="text-slate-400 hover:text-rose-400 p-1 transition-colors"
                title="Clear Console"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              {/* Expand Toggle */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 transition-colors"
                title={isExpanded ? 'Collapse Height' : 'Expand Height'}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </>
          )}

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-slate-400 hover:text-white p-1 transition-colors"
          >
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Drawer Body */}
      {isOpen && (
        <div
          className={`overflow-y-auto p-3 font-mono text-[11px] space-y-1 select-text bg-studio-950 ${
            isExpanded ? 'h-96' : 'h-48'
          }`}
        >
          {filteredLogs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-600 text-xs font-medium">
              No console outputs or stderr messages captured yet.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isErr = log.stream === 'stderr'
              return (
                <div
                  key={log.id}
                  className={`flex items-start gap-2.5 py-0.5 leading-relaxed ${
                    isErr ? 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/10 rounded px-1' : 'text-slate-300'
                  }`}
                >
                  <span className="text-[10px] text-slate-500 select-none flex-shrink-0 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded font-mono uppercase font-bold flex-shrink-0 ${
                      isErr
                        ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-400 border border-rose-800/40'
                        : 'bg-studio-900 text-slate-400'
                    }`}
                  >
                    {log.stream}
                  </span>
                  <span className="whitespace-pre-wrap break-all">{log.message}</span>
                </div>
              )
            })
          )}
          <div ref={logsEndRef} />
        </div>
      )}
    </div>
  )
}
