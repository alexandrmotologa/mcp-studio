import React from 'react'
import {
  Plus,
  Compass,
  Trash2,
  Play,
  Square,
  Server,
  Layers,
  FileCode2,
  MessageSquare,
  RotateCcw,
  Sparkles,
  Edit3,
  Loader2,
  Lock
} from 'lucide-react'
import { McpServerConfig, LicenseStatus, McpTool, McpResource, McpPrompt } from '../../../shared/types'

interface ServerSidebarProps {
  servers: McpServerConfig[]
  activeServerId: string | null
  setActiveServerId: (id: string) => void
  onOpenAddModal: () => void
  onOpenHubModal?: () => void
  onOpenDiscoverModal: () => void
  onConnectServer: (server: McpServerConfig) => void
  onDisconnectServer: (serverId: string) => void
  onDeleteServer: (server: McpServerConfig) => void
  onEditServer?: (server: McpServerConfig) => void
  license: LicenseStatus
  onOpenLicenseModal: () => void
  onOpenServerLimitModal?: (server?: McpServerConfig) => void
  serverMetadataMap: Record<
    string,
    {
      tools: McpTool[]
      resources: McpResource[]
      prompts: McpPrompt[]
    }
  >
}

export const ServerSidebar = React.memo<ServerSidebarProps>(({
  servers,
  activeServerId,
  setActiveServerId,
  onOpenAddModal,
  onOpenHubModal,
  onOpenDiscoverModal,
  onConnectServer,
  onDisconnectServer,
  onDeleteServer,
  onEditServer,
  license,
  onOpenLicenseModal,
  onOpenServerLimitModal,
  serverMetadataMap
}) => {
  return (
    <aside className="w-72 border-r border-studio-border bg-studio-900/60 flex flex-col h-full flex-shrink-0">
      {/* Top Header / Actions */}
      <div className="p-3 border-b border-studio-border flex items-center justify-between gap-1.5 min-w-0 bg-studio-950/40">
        <div className="flex items-center gap-1.5 min-w-0">
          <Server className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 whitespace-nowrap shrink-0">
            MCP Servers
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-studio-800 text-slate-300 font-bold shrink-0">
            {servers.length}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onOpenHubModal && (
            <button
              onClick={onOpenHubModal}
              className="p-1.5 rounded-md text-amber-400 hover:text-amber-300 hover:bg-studio-800 transition-colors"
              title="Open Official MCP Server Hub & Registry"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onOpenDiscoverModal}
            className="p-1.5 rounded-md text-slate-400 hover:text-cyan-400 hover:bg-studio-800 transition-colors"
            title="Auto-discover servers from Antigravity, Cursor, Claude, Windsurf & AI IDEs"
          >
            <Compass className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              if (!license.isPro && servers.length >= license.maxServers) {
                onOpenLicenseModal()
              } else {
                onOpenAddModal()
              }
            }}
            className="p-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm"
            title="Add new MCP server (stdio / sse)"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Server List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {servers.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <Server className="w-8 h-8 text-slate-600 mx-auto mb-2.5 opacity-50" />
            <p className="text-xs font-semibold text-slate-400">No servers configured</p>
            <p className="text-[11px] text-slate-500 mt-1">Connect a stdio CLI or SSE server to begin inspecting.</p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={onOpenAddModal}
                className="w-full py-1.5 px-3 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-sm"
              >
                Add Server
              </button>
              <button
                onClick={onOpenDiscoverModal}
                className="w-full py-1.5 px-3 rounded-md bg-studio-800 hover:bg-studio-700 text-slate-300 text-xs font-medium transition-colors border border-studio-border"
              >
                Scan Installed IDEs
              </button>
            </div>
          </div>
        ) : (
          servers.map((server, index) => {
            const isLocked = !license.isPro && index >= (license.maxServers || 1)
            const isActive = !isLocked && server.id === activeServerId
            const meta = serverMetadataMap[server.id] || { tools: [], resources: [], prompts: [] }

            return (
              <div
                key={server.id}
                onClick={() => {
                  if (isLocked) {
                    onOpenServerLimitModal?.(server)
                    return
                  }
                  setActiveServerId(server.id)
                }}
                className={`group relative p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isLocked
                    ? 'opacity-65 bg-studio-950/20 border-dashed border-slate-700/80 hover:border-amber-500/50 hover:opacity-90'
                    : isActive
                      ? 'bg-studio-850 border-indigo-500/60 shadow-sm shadow-indigo-950/40'
                      : 'bg-studio-950/40 hover:bg-studio-850/60 border-studio-border/60 hover:border-studio-border'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {isLocked ? (
                      <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                    ) : (
                      <span className="relative flex h-2 w-2 flex-shrink-0 items-center justify-center">
                        {server.status === 'connected' ? (
                          <>
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </>
                        ) : server.status === 'connecting' ? (
                          <Loader2 className="w-3 h-3 text-amber-400 animate-spin shrink-0" />
                        ) : server.status === 'error' ? (
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                        ) : (
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-600"></span>
                        )}
                      </span>
                    )}

                    <span className={`text-xs font-bold truncate ${isLocked ? 'text-slate-400' : 'text-slate-100'}`}>
                      {server.name}
                    </span>
                  </div>

                  {isLocked ? (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase font-bold flex items-center gap-0.5 shrink-0">
                      <Lock className="w-2.5 h-2.5" /> PRO
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-studio-800 text-slate-300 uppercase font-bold shrink-0">
                      {server.transport}
                    </span>
                  )}
                </div>

                {/* Subtitle / Details */}
                <div className="mt-1.5 text-[11px] font-mono text-slate-400 truncate">
                  {server.transport === 'stdio'
                    ? `${server.command} ${(server.args || []).slice(0, 2).join(' ')}`
                    : server.url}
                </div>

                {/* Connecting Status Banner */}
                {!isLocked && server.status === 'connecting' && (
                  <div className="mt-2 pt-1.5 border-t border-amber-500/20 flex items-center justify-between text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/30">
                    <div className="flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin text-amber-400 shrink-0" />
                      <span>Starting & loading tools...</span>
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-amber-300 font-bold animate-pulse">RUNNING</span>
                  </div>
                )}

                {/* Counters */}
                {!isLocked && server.status === 'connected' && (
                  <div className="mt-2 pt-1.5 border-t border-studio-border/50 flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1 font-semibold text-indigo-400">
                      <Layers className="w-3 h-3" />
                      {meta.tools.length} Tools
                    </span>
                    <span className="flex items-center gap-1">
                      <FileCode2 className="w-3 h-3 text-cyan-400" />
                      {meta.resources.length}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-purple-400" />
                      {meta.prompts.length}
                    </span>
                  </div>
                )}

                {/* Error Banner */}
                {!isLocked && server.status === 'error' && server.error && (
                  <div className="mt-1.5 text-[10px] text-rose-400 bg-rose-950/30 p-1.5 rounded border border-rose-900/40 line-clamp-1 font-medium">
                    {server.error}
                  </div>
                )}

                {/* Hover Actions */}
                <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-1 bg-studio-900/95 p-1 rounded-lg border border-studio-border shadow-lg">
                  {isLocked ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenServerLimitModal?.(server)
                      }}
                      className="p-1 rounded text-amber-400 hover:text-amber-300 hover:bg-studio-800 transition-colors"
                      title="Server locked: Free tier limit (Click to unlock)"
                    >
                      <Lock className="w-3 h-3" />
                    </button>
                  ) : server.status === 'connecting' ? (
                    <button
                      disabled
                      className="p-1 rounded text-amber-400 bg-amber-500/15 border border-amber-500/30 cursor-not-allowed flex items-center justify-center"
                      title="Server is starting and querying tools..."
                    >
                      <Loader2 className="w-3 h-3 animate-spin" />
                    </button>
                  ) : server.status === 'connected' ? (
                    <>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          onDisconnectServer(server.id)
                          setTimeout(() => onConnectServer(server), 150)
                        }}
                        className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-studio-800 transition-colors"
                        title="Hot-Restart Server (Reload Code)"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDisconnectServer(server.id)
                        }}
                        className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-studio-800"
                        title="Disconnect server"
                      >
                        <Square className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onConnectServer(server)
                      }}
                      className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-studio-800"
                      title="Connect server"
                    >
                      <Play className="w-3 h-3" />
                    </button>
                  )}

                  {!isLocked && onEditServer && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onEditServer(server)
                      }}
                      className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-studio-800"
                      title="Edit server configuration"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteServer(server)
                    }}
                    className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-studio-800"
                    title="Remove server"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Free Tier Notice */}
      {!license.isPro && servers.length > (license.maxServers || 1) ? (
        <div className="p-3 border-t border-studio-border bg-amber-500/5">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="text-amber-400 font-semibold flex items-center gap-1">
              <Lock className="w-3 h-3" /> Limit Exceeded
            </span>
            <span className="font-mono text-amber-400 font-bold">{servers.length}/{license.maxServers || 1} Servers</span>
          </div>
          <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">
            {servers.length - (license.maxServers || 1)} server(s) locked. Upgrade to Pro or delete excess servers.
          </p>
          <button
            onClick={() => onOpenServerLimitModal?.(servers[license.maxServers || 1])}
            className="w-full py-1.5 px-2.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Unlock All Servers</span>
          </button>
        </div>
      ) : !license.isPro && servers.length >= 1 ? (
        <div className="p-3 border-t border-studio-border bg-studio-950/60">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="text-slate-400 font-medium">Active Limit</span>
            <span className="font-mono text-amber-500 font-bold">{servers.length}/1 Servers</span>
          </div>
          <button
            onClick={onOpenLicenseModal}
            className="w-full py-1.5 px-2.5 rounded-lg text-xs font-bold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
          >
            <span>Unlock Multi-Tabs (Pro)</span>
          </button>
        </div>
      ) : null}
    </aside>
  )
})

ServerSidebar.displayName = 'ServerSidebar'
