import React from 'react'
import { Search, Power, Loader2, Play, Dices, Bookmark } from 'lucide-react'
import { McpTool, McpServerConfig } from '../../../shared/types'

export interface ToolListSidebarProps {
  tools: McpTool[]
  activeTool: McpTool | null
  server?: McpServerConfig
  serverName: string
  isServerRunning: boolean
  isServerConnecting: boolean
  searchQuery: string
  onSearchChange: (query: string) => void
  onSelectTool: (tool: McpTool) => void
  onOpenBatchModal: () => void
  onOpenCollections: () => void
  onConnectServer?: (server: McpServerConfig) => void
  toolResultsCache: Record<
    string,
    {
      success: boolean
      result?: unknown
      durationMs?: number
      error?: string
    }
  >
}

export const ToolListSidebar: React.FC<ToolListSidebarProps> = ({
  tools,
  activeTool,
  server,
  serverName,
  isServerRunning,
  isServerConnecting,
  searchQuery,
  onSearchChange,
  onSelectTool,
  onOpenBatchModal,
  onOpenCollections,
  onConnectServer,
  toolResultsCache
}) => {
  const filteredTools = tools.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="w-80 border-r border-studio-border flex flex-col bg-studio-950/40 shrink-0">
      {/* Search Header */}
      <div className="p-3 border-b border-studio-border flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-studio-900 border border-studio-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-sm"
          />
        </div>
        <button
          type="button"
          onClick={onOpenBatchModal}
          className="p-1.5 rounded-lg border border-studio-border bg-studio-900 text-indigo-400 hover:text-indigo-800 dark:hover:text-white hover:bg-studio-800 transition-colors shrink-0 shadow-sm"
          title="Batch Auto-Fill & Multi-Tool Runner"
        >
          <Dices className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onOpenCollections}
          className="p-1.5 rounded-lg border border-studio-border bg-studio-900 text-indigo-400 hover:text-indigo-800 dark:hover:text-white hover:bg-studio-800 transition-colors shrink-0 shadow-sm"
          title="Saved Collections & History"
        >
          <Bookmark className="w-4 h-4" />
        </button>
      </div>

      {/* Tool List Container */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {!isServerRunning ? (
          <div className="p-4 text-center space-y-2">
            <div className="w-9 h-9 mx-auto rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Power className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-200">Server Offline</p>
            <p className="text-[11px] text-slate-400 leading-snug">
              Start <strong className="font-mono text-slate-300">{serverName || 'server'}</strong> to discover tools and schema arguments.
            </p>
            {onConnectServer && (
              <button
                type="button"
                onClick={() => server && onConnectServer(server)}
                disabled={isServerConnecting || !server}
                className="w-full mt-2 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
              >
                {isServerConnecting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Starting...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Server</span>
                  </>
                )}
              </button>
            )}
          </div>
        ) : filteredTools.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400">
            No tools match your search.
          </div>
        ) : (
          filteredTools.map((tool) => {
            const isSelected = tool.name === activeTool?.name
            const cachedResult = toolResultsCache[tool.name]
            return (
              <button
                key={tool.name}
                type="button"
                onClick={() => onSelectTool(tool)}
                className={`w-full text-left p-2.5 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-indigo-500/10 dark:bg-indigo-600/15 border border-indigo-500/40 text-indigo-900 dark:text-indigo-200 shadow-sm'
                    : 'hover:bg-studio-900 text-slate-300 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {cachedResult && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          cachedResult.success ? 'bg-emerald-400' : 'bg-rose-400'
                        }`}
                        title={cachedResult.success ? 'Executed (Success / 200 OK)' : 'Executed (Error)'}
                      />
                    )}
                    <span className="text-xs font-mono font-black tracking-tight truncate text-slate-100">
                      {tool.name}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0" />
                  )}
                </div>
                {tool.description && (
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-snug font-medium">
                    {tool.description}
                  </p>
                )}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
