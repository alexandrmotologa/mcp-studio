import React, { useState } from 'react'
import { FileCode2, Copy, Check, Search, Database, RefreshCw, FileText, Power, Play, Loader2 } from 'lucide-react'
import { McpResource, McpResourceContent } from '../../../shared/types'

interface ResourceViewerProps {
  resources: McpResource[]
  serverId: string
  serverName: string
  serverStatus?: 'connected' | 'connecting' | 'disconnected' | 'error'
  onConnectServer?: () => void
  onReadResource: (uri: string) => Promise<{
    success: boolean
    contents?: McpResourceContent[]
    error?: string
  }>
}

export const ResourceViewer: React.FC<ResourceViewerProps> = ({
  resources,
  serverId,
  serverName,
  serverStatus,
  onConnectServer,
  onReadResource
}) => {
  const isServerRunning = serverStatus === 'connected'
  const isServerConnecting = serverStatus === 'connecting'
  const [selectedUri, setSelectedUri] = useState<string>(resources[0]?.uri || '')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [content, setContent] = useState<McpResourceContent[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const filteredResources = resources.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.uri.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeResource = resources.find((r) => r.uri === selectedUri) || resources[0]

  const handleFetchResource = async (uri: string) => {
    setSelectedUri(uri)
    setIsLoading(true)
    setError(null)
    setContent(null)

    const res = await onReadResource(uri)
    if (res.success && res.contents) {
      setContent(res.contents)
    } else {
      setError(res.error || 'Failed to read resource')
    }
    setIsLoading(false)
  }

  const handleCopy = () => {
    if (!content) return
    const textToCopy = content.map((c) => c.text || c.blob || '').join('\n')
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (resources.length === 0) {
    if (!isServerRunning) {
      return (
        <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-8 text-center bg-studio-950 overflow-y-auto">
          <div className="max-w-lg mx-auto space-y-4 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10 animate-pulse">
              <Power className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Server Offline ({serverName || 'Selected Server'})</span>
              </div>
              <h4 className="font-extrabold text-white text-base">MCP Server Must Be Started</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                MCP Resources expose live dynamic files, database schemas, and contextual attachments to clients. Start <strong className="text-slate-200 font-mono">{serverName || 'the server'}</strong> to explore and read live resources.
              </p>
            </div>

            {onConnectServer && (
              <button
                type="button"
                onClick={onConnectServer}
                disabled={isServerConnecting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isServerConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Starting Server...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Start "{serverName || 'MCP Server'}" Server</span>
                  </>
                )}
              </button>
            )}

            <div className="pt-3 border-t border-studio-border/60 w-full text-left space-y-2 bg-studio-900/30 p-3.5 rounded-xl border border-studio-border text-[11px] text-slate-400">
              <div className="font-bold text-slate-300">Resource Explorer Workflow:</div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-studio-800 border border-studio-border flex items-center justify-center text-[10px] font-bold text-slate-300 shrink-0">1</span>
                <span>Click <strong>Start Server</strong> to initialize the server and declare its resources.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-studio-800 border border-studio-border flex items-center justify-center text-[10px] font-bold text-slate-300 shrink-0">2</span>
                <span>Exposed resource URIs (e.g. <code className="text-cyan-400">file://</code>, <code className="text-cyan-400">postgres://</code>) load in the left list.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-studio-800 border border-studio-border flex items-center justify-center text-[10px] font-bold text-slate-300 shrink-0">3</span>
                <span>Click any resource to inspect its text contents or binary MIME type.</span>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-studio-950">
        <Database className="w-12 h-12 text-slate-400 dark:text-slate-700 mb-3" />
        <h3 className="text-sm font-semibold text-slate-300">No Resources Declared</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Server <span className="text-cyan-400 font-mono font-bold">{serverName}</span> is running, but does not declare any resources in its capability manifest.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-studio-950">
      {/* Resource List Sidebar */}
      <div className="w-80 border-r border-studio-border bg-studio-900/30 flex flex-col h-full flex-shrink-0">
        <div className="p-3 border-b border-studio-border bg-studio-950/80">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-studio-950 border border-studio-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors shadow-sm font-medium"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredResources.map((res) => {
            const isSelected = res.uri === selectedUri
            return (
              <button
                key={res.uri}
                onClick={() => handleFetchResource(res.uri)}
                className={`w-full text-left p-2.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-cyan-500/10 dark:bg-cyan-600/15 border-cyan-500/50 text-cyan-900 dark:text-white shadow-sm'
                    : 'bg-transparent border-transparent text-slate-400 hover:hover:bg-studio-850 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileCode2 className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span className="text-xs font-mono font-bold truncate text-slate-100">{res.name}</span>
                </div>
                <p className="text-[11px] font-mono text-slate-400 truncate mt-1 pl-5.5">{res.uri}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-studio-900/30">
        <div className="p-4 border-b border-studio-border bg-studio-900/40 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-mono font-extrabold text-white flex items-center gap-2">
              <span className="text-cyan-400">resource:</span>
              {activeResource?.name}
            </h2>
            <p className="text-xs font-mono text-slate-400 mt-1">{activeResource?.uri}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => activeResource && handleFetchResource(activeResource.uri)}
              disabled={isLoading || !activeResource}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-studio-850 hover:bg-studio-800 border border-studio-border text-slate-200 text-xs font-semibold transition-colors shadow-sm"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {content && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-studio-850 hover:bg-studio-800 border border-studio-border text-slate-200 text-xs font-semibold transition-colors shadow-sm"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 overflow-auto p-4 font-mono text-xs bg-studio-950/20">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin mb-2" />
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-400">
              <p className="font-bold">Error reading resource:</p>
              <p className="mt-1">{error}</p>
            </div>
          ) : content ? (
            <div className="space-y-4">
              {content.map((item, idx) => (
                <div key={idx} className="bg-studio-900 border border-studio-border rounded-xl p-4 shadow-sm">
                  {item.mimeType && (
                    <div className="text-[10px] font-mono text-cyan-400 mb-2 uppercase tracking-wider font-bold">
                      MIME: {item.mimeType}
                    </div>
                  )}
                  <pre className="text-slate-200 whitespace-pre-wrap leading-relaxed font-mono">
                    {item.text || item.blob || '(Empty resource content)'}
                  </pre>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500">
              <FileText className="w-8 h-8 mb-2 opacity-40" />
              <p className="font-medium">Select a resource to inspect its content.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
