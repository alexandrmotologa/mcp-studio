import React from 'react'
import { Sparkles, X, Radio, Loader2 } from 'lucide-react'
import { McpServerConfig, McpTool } from '../../../shared/types'

interface ServerTabsBarProps {
  servers: McpServerConfig[]
  activeServerId: string | null
  onSelectServer: (id: string) => void
  onOpenHubModal: () => void
  onDisconnectServer?: (id: string) => void
  serverMetadataMap: Record<
    string,
    {
      tools: McpTool[]
    }
  >
}

export const ServerTabsBar = React.memo<ServerTabsBarProps>(({
  servers,
  activeServerId,
  onSelectServer,
  onOpenHubModal,
  onDisconnectServer,
  serverMetadataMap
}) => {
  const runningServers = servers.filter((s) => s.status === 'connected' || s.status === 'connecting')

  return (
    <div className="h-10 bg-studio-950 border-b border-studio-border px-3 flex items-center justify-between gap-2 overflow-x-auto select-none flex-shrink-0">
      {/* Tabs List */}
      <div className="flex items-center gap-1.5 overflow-x-auto">
        {runningServers.length === 0 ? (
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium px-2 py-1 select-none">
            <Radio className="w-3.5 h-3.5 opacity-40 animate-pulse" />
            <span>No active servers running — click Play in the sidebar to start one</span>
          </div>
        ) : (
          runningServers.map((server) => {
            const isActive = server.id === activeServerId
            const meta = serverMetadataMap[server.id]
            const isConnected = server.status === 'connected'

            return (
              <div
                key={server.id}
                onClick={() => onSelectServer(server.id)}
                className={`group h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all border cursor-pointer select-none ${
                  isActive
                    ? 'bg-studio-850 text-white border-studio-border shadow-sm shadow-slate-200/50 dark:shadow-black/40'
                    : 'bg-studio-900/40 text-slate-300 border-transparent hover:bg-studio-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {isConnected ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/80 animate-pulse shrink-0" />
                  ) : (
                    <Loader2 className="w-3 h-3 text-amber-400 animate-spin shrink-0" />
                  )}
                  <span className="truncate max-w-[140px] text-slate-100 font-bold">{server.name}</span>
                </div>

                {meta?.tools && meta.tools.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-studio-950 text-indigo-300 font-mono font-bold border border-indigo-200 dark:border-studio-border/60">
                    {meta.tools.length}
                  </span>
                )}

                {onDisconnectServer && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDisconnectServer(server.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-studio-800 text-slate-400 hover:text-rose-400 transition-all"
                    title="Stop & disconnect server"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Hub / Store Button */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={onOpenHubModal}
          className="h-7 px-2.5 rounded-lg bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-300 border border-indigo-800/40 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          title="Open MCP Server Registry & Hub"
        >
          <Sparkles className="w-3 h-3 text-amber-500 dark:text-amber-300 animate-pulse" />
          <span>Server Hub</span>
        </button>
      </div>
    </div>
  )
})

ServerTabsBar.displayName = 'ServerTabsBar'
