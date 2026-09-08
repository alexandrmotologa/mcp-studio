import React, { useState, useEffect } from 'react'
import { X, Server, Terminal, Globe, Plus, Trash2, FolderOpen, Edit3 } from 'lucide-react'
import { McpServerConfig } from '../../../shared/types'

interface AddServerModalProps {
  isOpen: boolean
  onClose: () => void
  onAddServer: (config: McpServerConfig) => void
  initialConfig?: McpServerConfig | null
}

export const AddServerModal: React.FC<AddServerModalProps> = ({
  isOpen,
  onClose,
  onAddServer,
  initialConfig
}) => {
  const [name, setName] = useState('')
  const [transport, setTransport] = useState<'stdio' | 'sse'>('stdio')
  const [command, setCommand] = useState('node')
  const [argsString, setArgsString] = useState('')
  const [cwd, setCwd] = useState('')
  const [url, setUrl] = useState('')
  const [envPairs, setEnvPairs] = useState<{ key: string; value: string }[]>([])

  useEffect(() => {
    if (initialConfig) {
      setName(initialConfig.name || '')
      setTransport(initialConfig.transport || 'stdio')
      setCommand(initialConfig.command || 'node')
      setArgsString((initialConfig.args || []).join(' '))
      setCwd(initialConfig.cwd || '')
      setUrl(initialConfig.url || '')
      if (initialConfig.env && typeof initialConfig.env === 'object') {
        setEnvPairs(
          Object.entries(initialConfig.env).map(([key, value]) => ({
            key,
            value: String(value)
          }))
        )
      } else {
        setEnvPairs([])
      }
    } else {
      setName('')
      setTransport('stdio')
      setCommand('node')
      setArgsString('')
      setCwd('')
      setUrl('')
      setEnvPairs([])
    }
  }, [initialConfig, isOpen])

  if (!isOpen) return null

  const handleAddEnv = () => {
    setEnvPairs([...envPairs, { key: '', value: '' }])
  }

  const handleRemoveEnv = (index: number) => {
    setEnvPairs(envPairs.filter((_, i) => i !== index))
  }

  const handleEnvChange = (index: number, field: 'key' | 'value', val: string) => {
    const next = [...envPairs]
    const item = next[index]
    if (item) {
      item[field] = val
      setEnvPairs(next)
    }
  }

  const handlePickDirectory = async () => {
    const selected = await window.api.dialog.openDirectory()
    if (selected) {
      setCwd(selected)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const envMap: Record<string, string> = {}
    for (const pair of envPairs) {
      if (pair.key.trim()) {
        envMap[pair.key.trim()] = pair.value.trim()
      }
    }

    const args = argsString
      .trim()
      .split(' ')
      .filter((a) => a.length > 0)

    const base = {
      id: initialConfig ? initialConfig.id : crypto.randomUUID(),
      name: name.trim(),
      status: 'disconnected' as const,
      createdAt: initialConfig?.createdAt || Date.now()
    }

    const newConfig: McpServerConfig =
      transport === 'stdio'
        ? {
            ...base,
            transport: 'stdio',
            command: command.trim() || 'node',
            args: args.length > 0 ? args : undefined,
            cwd: cwd.trim() ? cwd.trim() : undefined,
            env: Object.keys(envMap).length > 0 ? envMap : undefined
          }
        : {
            ...base,
            transport: 'sse',
            url: url.trim()
          }

    onAddServer(newConfig)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-studio-900 border border-studio-border rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-studio-border flex items-center justify-between bg-studio-950/40">
          <div className="flex items-center gap-2">
            {initialConfig ? (
              <Edit3 className="w-4 h-4 text-indigo-400" />
            ) : (
              <Server className="w-4 h-4 text-indigo-400" />
            )}
            <h3 className="text-sm font-extrabold text-white">
              {initialConfig ? 'Edit MCP Server' : 'Add New MCP Server'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* Server Name */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">Server Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Postgres Database Server or GitHub MCP"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-studio-950 border border-studio-border rounded-lg px-3 py-2 text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-indigo-500 shadow-sm font-medium"
            />
          </div>

          {/* Transport Selector */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">Transport Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTransport('stdio')}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all shadow-sm ${
                  transport === 'stdio'
                    ? 'bg-indigo-50 dark:bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-studio-950 border-studio-border text-slate-400 hover:bg-slate-50'
                }`}
              >
                <Terminal className="w-4 h-4" />
                Stdio (Local CLI)
              </button>
              <button
                type="button"
                onClick={() => setTransport('sse')}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all shadow-sm ${
                  transport === 'sse'
                    ? 'bg-indigo-50 dark:bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-studio-950 border-studio-border text-slate-400 hover:bg-slate-50'
                }`}
              >
                <Globe className="w-4 h-4" />
                SSE (Remote HTTP)
              </button>
            </div>
          </div>

          {/* Stdio Specifics */}
          {transport === 'stdio' ? (
            <>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Command *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. node, python, npx, uv"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  className="w-full bg-studio-950 border border-studio-border rounded-lg px-3 py-2 text-slate-200 placeholder-slate-400 font-mono focus:outline-none focus:border-indigo-500 shadow-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Arguments (Space separated)</label>
                <input
                  type="text"
                  placeholder="e.g. dist/index.js --port 8080"
                  value={argsString}
                  onChange={(e) => setArgsString(e.target.value)}
                  className="w-full bg-studio-950 border border-studio-border rounded-lg px-3 py-2 text-slate-200 placeholder-slate-400 font-mono focus:outline-none focus:border-indigo-500 shadow-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Working Directory (Optional)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="C:\Projects\my-mcp-server"
                    value={cwd}
                    onChange={(e) => setCwd(e.target.value)}
                    className="flex-1 bg-studio-950 border border-studio-border rounded-lg px-3 py-2 text-slate-200 placeholder-slate-400 font-mono focus:outline-none focus:border-indigo-500 shadow-sm font-medium"
                  />
                  <button
                    type="button"
                    onClick={handlePickDirectory}
                    className="px-3 py-2 bg-studio-800 hover:bg-studio-700 rounded-lg border border-studio-border text-slate-300 shadow-sm"
                  >
                    <FolderOpen className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-slate-300 font-bold mb-1">SSE Endpoint URL *</label>
              <input
                type="url"
                required
                placeholder="http://localhost:3000/sse"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-studio-950 border border-studio-border rounded-lg px-3 py-2 text-slate-200 placeholder-slate-400 font-mono focus:outline-none focus:border-indigo-500 shadow-sm font-medium"
              />
            </div>
          )}

          {/* Environment Variables */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-300 font-bold">Environment Variables (.env)</label>
              <button
                type="button"
                onClick={handleAddEnv}
                className="text-[11px] text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Variable
              </button>
            </div>

            <div className="space-y-1.5">
              {envPairs.map((pair, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="KEY"
                    value={pair.key}
                    onChange={(e) => handleEnvChange(index, 'key', e.target.value)}
                    className="flex-1 bg-studio-950 border border-studio-border rounded-lg px-2.5 py-1.5 text-slate-200 font-mono shadow-sm font-medium"
                  />
                  <input
                    type="text"
                    placeholder="VALUE"
                    value={pair.value}
                    onChange={(e) => handleEnvChange(index, 'value', e.target.value)}
                    className="flex-1 bg-studio-950 border border-studio-border rounded-lg px-2.5 py-1.5 text-slate-200 font-mono shadow-sm font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveEnv(index)}
                    className="p-1.5 text-slate-400 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-studio-border flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-studio-800 hover:bg-studio-700 text-slate-300 font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-600/30 transition-colors"
            >
              {initialConfig ? 'Save Changes' : 'Save Server'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
