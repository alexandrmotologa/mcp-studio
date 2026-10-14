import React, { useMemo } from 'react'
import {
  X,
  BarChart3,
  Download,
  Activity,
  Zap,
  Gauge,
  AlertTriangle,
  Server,
  Layers,
  FileDown
} from 'lucide-react'
import { JsonRpcLog } from '../../../shared/types'
import {
  computeTrafficMetrics,
  formatBytes,
  downloadTrafficSession
} from '../utils/tokenEstimator'

interface TrafficAnalyticsDrawerProps {
  isOpen: boolean
  onClose: () => void
  logs: JsonRpcLog[]
  onClearLogs?: () => void
}

export const TrafficAnalyticsDrawer: React.FC<TrafficAnalyticsDrawerProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs
}) => {
  const metrics = useMemo(() => computeTrafficMetrics(logs), [logs])

  const errorRatePercent = metrics.totalCalls > 0
    ? ((metrics.errorCount / metrics.totalCalls) * 100).toFixed(1)
    : '0.0'

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-studio-900 border-l border-studio-border h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-studio-border bg-studio-950/80 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Traffic &amp; Token Analytics</h3>
              <p className="text-xs text-slate-400 font-medium">
                Live protocol telemetry, latency percentiles &amp; payload metrics
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

        {/* Scrollable Analytics Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Top Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-studio-950/70 border border-studio-border flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Total Requests</span>
                <Activity className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-extrabold text-white font-mono">
                {metrics.totalCalls}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {metrics.errorCount > 0 ? (
                  <span className="text-rose-400 flex items-center gap-1 font-medium">
                    <AlertTriangle className="w-3 h-3" />
                    {metrics.errorCount} failed ({errorRatePercent}%)
                  </span>
                ) : (
                  <span className="text-emerald-400 font-medium">100% success rate</span>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-studio-950/70 border border-studio-border flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Estimated Tokens</span>
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-extrabold text-amber-400 font-mono">
                ~{metrics.totalEstimatedTokens.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium">
                Combined prompt &amp; response
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-studio-950/70 border border-studio-border flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Data Volume</span>
                <Download className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-extrabold text-indigo-300 font-mono">
                {formatBytes(metrics.totalBytesTransferred)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium">
                Wire bytes transferred
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-studio-950/70 border border-studio-border flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Avg Latency</span>
                <Gauge className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-extrabold text-purple-300 font-mono">
                {metrics.avgDurationMs}
                <span className="text-sm text-slate-400 ml-1">ms</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium">
                Round-trip duration
              </div>
            </div>
          </div>

          {/* Latency Distribution Percentiles */}
          <div className="p-4 rounded-xl bg-studio-950/70 border border-studio-border space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              <span>Latency Distribution Percentiles</span>
            </div>

            <div className="grid grid-cols-3 gap-3 font-mono">
              <div className="p-3 rounded-lg bg-studio-900 border border-studio-border text-center">
                <div className="text-[11px] text-slate-400 font-bold mb-1">P50 (Median)</div>
                <div className="text-lg font-extrabold text-emerald-400">
                  {metrics.p50DurationMs}ms
                </div>
              </div>
              <div className="p-3 rounded-lg bg-studio-900 border border-studio-border text-center">
                <div className="text-[11px] text-slate-400 font-bold mb-1">P95 Threshold</div>
                <div className="text-lg font-extrabold text-amber-400">
                  {metrics.p95DurationMs}ms
                </div>
              </div>
              <div className="p-3 rounded-lg bg-studio-900 border border-studio-border text-center">
                <div className="text-[11px] text-slate-400 font-bold mb-1">P99 Tail</div>
                <div className="text-lg font-extrabold text-rose-400">
                  {metrics.p99DurationMs}ms
                </div>
              </div>
            </div>
          </div>

          {/* Traffic Breakdown by Server */}
          <div className="p-4 rounded-xl bg-studio-950/70 border border-studio-border space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-indigo-400" />
              <span>Traffic by MCP Server</span>
            </div>

            <div className="space-y-2">
              {Object.keys(metrics.callsByServer).length === 0 ? (
                <div className="text-xs text-slate-500 py-3 text-center">No traffic recorded yet</div>
              ) : (
                Object.entries(metrics.callsByServer).map(([serverName, count]) => {
                  const share = metrics.totalCalls > 0 ? (count / metrics.totalCalls) * 100 : 0
                  return (
                    <div key={serverName} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-200 truncate max-w-[240px]">{serverName}</span>
                        <span className="font-mono text-slate-400 text-[11px]">
                          {count} ({share.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-studio-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                          style={{ width: `${share}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Traffic Breakdown by Method */}
          <div className="p-4 rounded-xl bg-studio-950/70 border border-studio-border space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Calls by Method</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {Object.keys(metrics.callsByMethod).length === 0 ? (
                <div className="text-xs text-slate-500 py-3 text-center w-full">No RPC methods invoked</div>
              ) : (
                Object.entries(metrics.callsByMethod).map(([method, count]) => (
                  <div
                    key={method}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-studio-900 border border-studio-border text-xs font-mono"
                  >
                    <span className="text-slate-300 font-medium">{method}</span>
                    <span className="px-1.5 py-0.2 rounded bg-studio-800 text-cyan-400 font-bold">
                      {count}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer & Session Export Actions */}
        <div className="p-4 border-t border-studio-border bg-studio-950/90 flex items-center justify-between flex-shrink-0">
          {onClearLogs && (
            <button
              onClick={onClearLogs}
              className="text-xs text-slate-400 hover:text-rose-400 transition-colors"
            >
              Clear Session Traffic
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => downloadTrafficSession(logs, 'json')}
              disabled={logs.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 bg-studio-850 hover:bg-studio-800 border border-studio-border disabled:opacity-40 transition-all cursor-pointer"
              title="Download raw JSON-RPC log entries"
            >
              <FileDown className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={() => downloadTrafficSession(logs, 'har')}
              disabled={logs.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 transition-all cursor-pointer shadow-md shadow-cyan-600/20"
              title="Export standard HTTP Archive (HAR) for proxy and browser replay tools"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export HAR</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
