import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  FileCode2,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import {
  ClientSyncTarget,
  ClientSyncTargetId,
  ClientSyncDiff,
  ClientSyncResult,
  McpServerConfig
} from '../../../shared/types'

interface ConfigSyncModalProps {
  isOpen: boolean
  onClose: () => void
  servers: McpServerConfig[]
}

export const ConfigSyncModal: React.FC<ConfigSyncModalProps> = ({
  isOpen,
  onClose,
  servers
}) => {
  const [targets, setTargets] = useState<ClientSyncTarget[]>([])
  const [selectedTargetId, setSelectedTargetId] = useState<ClientSyncTargetId>('antigravity')
  const [selectedServerIds, setSelectedServerIds] = useState<Set<string>>(
    () => new Set(servers.map((s) => s.id))
  )
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [diff, setDiff] = useState<ClientSyncDiff | null>(null)
  const [syncResult, setSyncResult] = useState<ClientSyncResult | null>(null)
  const [showJsonDiff, setShowJsonDiff] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Reset or load targets when modal opens
  const loadTargets = useCallback(async () => {
    try {
      setLoading(true)
      setErrorMessage(null)
      const list = await window.api.mcp.listSyncTargets()
      setTargets(list)
      // Pick first writable target if current is not writable
      if (list.length > 0) {
        const found = list.find((t) => t.id === selectedTargetId)
        if (!found || !found.isWritable) {
          const firstWritable = list.find((t) => t.isWritable) || list[0]
          if (firstWritable) {
            setSelectedTargetId(firstWritable.id)
          }
        }
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to detect client targets')
    } finally {
      setLoading(false)
    }
  }, [selectedTargetId])

  useEffect(() => {
    if (isOpen) {
      setSelectedServerIds(new Set(servers.map((s) => s.id)))
      setSyncResult(null)
      setDiff(null)
      loadTargets()
    }
  }, [isOpen, servers, loadTargets])

  const selectedServers = useMemo(() => {
    return servers.filter((s) => selectedServerIds.has(s.id))
  }, [servers, selectedServerIds])

  // Fetch diff preview whenever target or selected servers change
  const fetchDiff = useCallback(async () => {
    if (!isOpen || selectedServers.length === 0) {
      setDiff(null)
      return
    }
    try {
      setErrorMessage(null)
      const preview = await window.api.mcp.previewClientConfigDiff(selectedTargetId, selectedServers)
      setDiff(preview)
    } catch (err) {
      setDiff(null)
      setErrorMessage(err instanceof Error ? err.message : 'Failed to generate diff')
    }
  }, [isOpen, selectedTargetId, selectedServers])

  useEffect(() => {
    if (isOpen && targets.length > 0) {
      fetchDiff()
    }
  }, [isOpen, targets, selectedTargetId, selectedServerIds, fetchDiff])

  const handleToggleServer = (id: string) => {
    setSelectedServerIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    if (selectedServerIds.size === servers.length) {
      setSelectedServerIds(new Set())
    } else {
      setSelectedServerIds(new Set(servers.map((s) => s.id)))
    }
  }

  const handleSync = async () => {
    if (selectedServers.length === 0) return
    try {
      setSyncing(true)
      setErrorMessage(null)
      const res = await window.api.mcp.syncConfigToClient(selectedTargetId, selectedServers)
      setSyncResult(res)
      if (res.success) {
        // Refresh targets to update counts
        await loadTargets()
      } else {
        setErrorMessage(res.error || 'Sync write-back failed')
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Sync execution failed')
    } finally {
      setSyncing(false)
    }
  }

  if (!isOpen) return null

  const selectedTarget = targets.find((t) => t.id === selectedTargetId)

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-studio-900 border border-studio-border rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-studio-border bg-studio-950/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-sm">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">2-Way Client Config Sync</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Write-Back Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Synchronize active MCP servers directly into your desktop AI client configurations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-studio-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Target Host Clients Grid */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                Select Destination AI Client
              </label>
              {loading && <span className="text-[11px] text-slate-400 animate-pulse">Detecting clients...</span>}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {targets.map((t) => {
                const isSelected = t.id === selectedTargetId
                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      setSelectedTargetId(t.id)
                      setSyncResult(null)
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-500/10 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/40'
                        : 'bg-studio-950/60 border-studio-border text-slate-300 hover:bg-studio-850 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold truncate">{t.name}</span>
                        {t.exists ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-400" title="Config file detected" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-slate-600" title="Config file not yet created" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono truncate" title={t.configFilePath}>
                        {t.configFilePath.split(/[\\/]/).pop()}
                      </p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-studio-border/50 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">{t.installedServerCount} installed</span>
                      <span className={t.isWritable ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
                        {t.isWritable ? 'Writable' : 'Locked'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Servers Selection */}
          <div className="bg-studio-950/70 border border-studio-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Select Servers to Synchronize ({selectedServers.length}/{servers.length})
              </span>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                {selectedServerIds.size === servers.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {servers.map((s) => {
                const checked = selectedServerIds.has(s.id)
                return (
                  <label
                    key={s.id}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      checked
                        ? 'bg-indigo-950/30 border-indigo-500/40 text-slate-100'
                        : 'bg-studio-900 border-studio-border text-slate-400 hover:bg-studio-850'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleServer(s.id)}
                      className="rounded border-slate-700 bg-studio-950 text-indigo-500 focus:ring-indigo-400 h-4 w-4"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate">{s.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono uppercase">{s.transport}</div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Diff Overview */}
          {diff && (
            <div className="bg-studio-950/70 border border-studio-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <FileCode2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Config Changes Preview</span>
                </div>
                <button
                  onClick={() => setShowJsonDiff(!showJsonDiff)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showJsonDiff ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  <span>{showJsonDiff ? 'Hide JSON View' : 'Inspect JSON Diff'}</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {diff.serversToAdd.length > 0 && (
                  <span className="px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-medium">
                    +{diff.serversToAdd.length} to add ({diff.serversToAdd.join(', ')})
                  </span>
                )}
                {diff.serversToUpdate.length > 0 && (
                  <span className="px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 font-medium">
                    ~{diff.serversToUpdate.length} to update ({diff.serversToUpdate.join(', ')})
                  </span>
                )}
                {diff.serversUnchanged.length > 0 && (
                  <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-400">
                    ={diff.serversUnchanged.length} unchanged ({diff.serversUnchanged.join(', ')})
                  </span>
                )}
              </div>

              {showJsonDiff && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 font-mono text-[11px]">
                  <div className="border border-studio-border rounded-lg p-3 bg-studio-900/60">
                    <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Current Config</div>
                    <pre className="text-slate-300 max-h-48 overflow-auto leading-relaxed">
                      {diff.beforeJson}
                    </pre>
                  </div>
                  <div className="border border-indigo-500/30 rounded-lg p-3 bg-indigo-950/20">
                    <div className="text-[10px] text-indigo-400 uppercase font-bold mb-1">Preview Synchronized Config</div>
                    <pre className="text-indigo-200 max-h-48 overflow-auto leading-relaxed">
                      {diff.afterJson}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Feedback & Result Alerts */}
          {syncResult?.success && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">
                  Successfully synchronized {syncResult.syncedServerCount} server(s) to {selectedTarget?.name}!
                </p>
                {syncResult.backupFilePath && (
                  <p className="text-[11px] text-slate-400 font-mono">
                    Safe backup created: {syncResult.backupFilePath}
                  </p>
                )}
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Sync Failed</p>
                <p className="text-[11px]">{errorMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-studio-border bg-studio-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Automatic `.bak` snapshot created before writing</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-studio-850 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSync}
              disabled={syncing || selectedServers.length === 0 || !selectedTarget?.isWritable}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/30 transition-all"
            >
              {syncing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Writing to Client...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Write-Back &amp; Sync ({selectedServers.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
