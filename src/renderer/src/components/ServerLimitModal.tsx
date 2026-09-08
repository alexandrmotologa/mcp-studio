import React from 'react'
import { Modal } from './Modal'
import { Sparkles, Lock, Server, CheckCircle2, Trash2, ArrowRight } from 'lucide-react'
import { McpServerConfig } from '../../../shared/types'

interface ServerLimitModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenLicenseModal: () => void
  lockedServer?: McpServerConfig | null
  totalServersCount: number
  maxAllowed?: number
}

export const ServerLimitModal: React.FC<ServerLimitModalProps> = ({
  isOpen,
  onClose,
  onOpenLicenseModal,
  lockedServer,
  totalServersCount,
  maxAllowed = 1
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-lg"
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-sm shadow-amber-950/40">
            <Lock className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Community Edition Server Limit</h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Maximum {maxAllowed} server allowed on Free Tier ({totalServersCount} configured)
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Notice description */}
        <p className="text-xs text-slate-300 leading-relaxed">
          The free Community Edition is designed for single-server development and testing. To run or switch between multiple MCP servers, upgrade to Pro or remove excess servers.
        </p>

        {/* Locked Server Card */}
        {lockedServer && (
          <div className="p-3.5 rounded-xl bg-studio-950/70 border border-amber-500/30 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 shrink-0 text-amber-400">
              <Server className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-100 truncate">{lockedServer.name}</span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                  LOCKED
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400 truncate mt-1">
                {lockedServer.transport === 'stdio'
                  ? `${lockedServer.command} ${(lockedServer.args || []).slice(0, 2).join(' ')}`
                  : lockedServer.url}
              </p>
            </div>
          </div>
        )}

        {/* Pro Benefits Highlights */}
        <div className="rounded-xl bg-studio-950/50 border border-studio-border p-3.5 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Why Upgrade to MCP Studio Pro?</span>
          </div>

          <ul className="space-y-1.5 text-xs text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Connect up to <strong>100 servers concurrently</strong> (stdio & SSE)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Multi-turn AI Agent Simulator (OpenAI, Claude, Ollama, DeepSeek)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Model Arena side-by-side benchmarking & zero-config Docker exports</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>One-click team workspace sync via secure cloud vault</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          <button
            onClick={() => {
              onClose()
              onOpenLicenseModal()
            }}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 hover:from-indigo-500 hover:to-purple-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/40 border border-indigo-400/30 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Upgrade to Pro to Unlock All Servers</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 px-4 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-studio-800/80 border border-studio-border transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Manage Servers (Delete Excess from Sidebar)</span>
          </button>
        </div>
      </div>
    </Modal>
  )
}
