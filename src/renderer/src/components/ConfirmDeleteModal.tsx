import React, { useEffect } from 'react'
import { AlertTriangle, Trash2, X, Terminal, Globe } from 'lucide-react'
import { McpServerConfig } from '../../../shared/types'

interface ConfirmDeleteModalProps {
  isOpen: boolean
  server: McpServerConfig | null
  onConfirm: () => void
  onClose: () => void
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  server,
  onConfirm,
  onClose
}) => {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        onConfirm()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onConfirm, onClose])

  if (!isOpen || !server) return null

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-studio-900 border border-rose-500/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-studio-border bg-studio-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 shadow-sm">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span className="studio-brand-title">Delete MCP Server</span>
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Confirm server removal from MCP Studio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          <p className="text-slate-300 font-bold">
            Are you sure you want to delete this MCP server?
          </p>

          {/* Server Details Card */}
          <div className="p-4 rounded-2xl border border-studio-border bg-studio-950/60 space-y-2 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {server.transport === 'stdio' ? (
                  <Terminal className="w-4 h-4 text-cyan-400 shrink-0" />
                ) : (
                  <Globe className="w-4 h-4 text-purple-400 shrink-0" />
                )}
                <span className="font-extrabold text-white text-sm truncate">
                  {server.name}
                </span>
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                {server.transport}
              </span>
            </div>

            <div className="font-mono text-[11px] text-slate-400 bg-studio-900 p-2.5 rounded-xl border border-studio-border truncate font-medium">
              {server.transport === 'stdio'
                ? `${server.command || ''} ${(server.args || []).join(' ')}`
                : server.url || ''}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-300 text-[11px] leading-relaxed font-bold shadow-sm">
            ⚠️ This will immediately disconnect any active process and permanently remove this server and its cached tools from MCP Studio.
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-studio-border bg-studio-950/60 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-studio-800 border border-studio-border transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-md shadow-rose-900/30 flex items-center gap-1.5 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Server</span>
          </button>
        </div>
      </div>
    </div>
  )
}
