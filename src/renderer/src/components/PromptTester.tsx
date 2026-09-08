import React, { useState } from 'react'
import { MessageSquare, Play, Copy, Check, Search, MessageCircle, Sliders, Sparkles, Power, Loader2 } from 'lucide-react'
import { McpPrompt } from '../../../shared/types'

interface PromptTesterProps {
  prompts: McpPrompt[]
  serverId: string
  serverName: string
  serverStatus?: 'connected' | 'connecting' | 'disconnected' | 'error'
  onConnectServer?: () => void
  onGetPrompt: (
    promptName: string,
    args?: Record<string, string>
  ) => Promise<{
    success: boolean
    messages?: any[]
    description?: string
    error?: string
  }>
  onSendToSimulator?: (promptText: string) => void
}

export const PromptTester: React.FC<PromptTesterProps> = ({
  prompts,
  serverId,
  serverName,
  serverStatus,
  onConnectServer,
  onGetPrompt,
  onSendToSimulator
}) => {
  const isServerRunning = serverStatus === 'connected'
  const isServerConnecting = serverStatus === 'connecting'
  const [selectedPromptName, setSelectedPromptName] = useState<string>(prompts[0]?.name || '')
  const [searchQuery, setSearchQuery] = useState('')
  const [formArgs, setFormArgs] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [renderedMessages, setRenderedMessages] = useState<any[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const filteredPrompts = prompts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activePrompt = prompts.find((p) => p.name === selectedPromptName) || prompts[0]

  const handleSelectPrompt = (prompt: McpPrompt) => {
    setSelectedPromptName(prompt.name)
    setFormArgs({})
    setRenderedMessages(null)
    setError(null)
  }

  const handleRenderPrompt = async () => {
    if (!activePrompt) return
    setIsLoading(true)
    setError(null)
    setRenderedMessages(null)

    const res = await onGetPrompt(activePrompt.name, formArgs)
    if (res.success && res.messages) {
      setRenderedMessages(res.messages)
    } else {
      setError(res.error || 'Failed to render prompt')
    }
    setIsLoading(false)
  }

  const handleCopy = () => {
    if (!renderedMessages) return
    navigator.clipboard.writeText(JSON.stringify(renderedMessages, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (prompts.length === 0) {
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
                MCP Prompts provide slash-command templates and dynamic instruction sets. Start <strong className="text-slate-200 font-mono">{serverName || 'the server'}</strong> to test prompt generation and preview AI arguments.
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
              <div className="font-bold text-slate-300">Prompt Tester Workflow:</div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-studio-800 border border-studio-border flex items-center justify-center text-[10px] font-bold text-slate-300 shrink-0">1</span>
                <span>Click <strong>Start Server</strong> to connect and load prompt schemas.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-studio-800 border border-studio-border flex items-center justify-center text-[10px] font-bold text-slate-300 shrink-0">2</span>
                <span>Select any prompt template from the left list.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-studio-800 border border-studio-border flex items-center justify-center text-[10px] font-bold text-slate-300 shrink-0">3</span>
                <span>Fill prompt arguments, render template, or send directly to AI Simulator.</span>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-studio-950">
        <MessageSquare className="w-12 h-12 text-slate-400 dark:text-slate-700 mb-3" />
        <h3 className="text-sm font-semibold text-slate-300">No Prompts Declared</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Server <span className="text-purple-400 font-mono font-bold">{serverName}</span> is running, but does not declare any prompt templates in its capability manifest.
        </p>
      </div>
    )
  }

  const argsList = activePrompt?.arguments || []

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-studio-950">
      {/* Prompt List Sidebar */}
      <div className="w-72 border-r border-studio-border bg-studio-900/30 flex flex-col h-full flex-shrink-0">
        <div className="p-3 border-b border-studio-border bg-studio-950/80">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-studio-950 border border-studio-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors shadow-sm font-medium"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredPrompts.map((prompt) => {
            const isSelected = prompt.name === selectedPromptName
            return (
              <button
                key={prompt.name}
                onClick={() => handleSelectPrompt(prompt)}
                className={`w-full text-left p-2.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-purple-500/10 dark:bg-purple-600/15 border-purple-500/50 text-purple-900 dark:text-white shadow-sm'
                    : 'bg-transparent border-transparent text-slate-400 hover:hover:bg-studio-850 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className={`w-3.5 h-3.5 ${isSelected ? 'text-purple-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span className="text-xs font-mono font-bold truncate">{prompt.name}</span>
                </div>
                {prompt.description && (
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 pl-5.5 font-medium">{prompt.description}</p>
                )}
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
              <span className="text-purple-400">prompt:</span>
              {activePrompt?.name}
            </h2>
            {activePrompt?.description && (
              <p className="text-xs text-slate-400 mt-1 font-medium">{activePrompt.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRenderPrompt}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-600/25 transition-all disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Rendering...' : 'Render Prompt'}</span>
            </button>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-studio-border">
          {/* Left Column: Arguments */}
          <div className="flex flex-col h-full overflow-y-auto p-4 bg-studio-950">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-purple-400" />
                Prompt Arguments
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-500">{argsList.length} Args</span>
            </div>

            {argsList.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-studio-border rounded-xl bg-studio-900/20">
                <p className="text-xs text-slate-400">This prompt template has no required arguments.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {argsList.map((arg) => (
                  <div key={arg.name} className="space-y-1">
                    <label className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
                      {arg.name}
                      {arg.required && <span className="text-rose-500">*</span>}
                    </label>
                    {arg.description && <p className="text-[11px] text-slate-400">{arg.description}</p>}
                    <input
                      type="text"
                      placeholder={arg.description || arg.name}
                      value={formArgs[arg.name] || ''}
                      onChange={(e) => setFormArgs({ ...formArgs, [arg.name]: e.target.value })}
                      className="w-full bg-studio-900 border border-studio-border rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-mono shadow-sm font-medium"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Rendered Messages */}
          <div className="flex flex-col h-full overflow-hidden bg-studio-900/30">
            <div className="p-3 border-b border-studio-border flex items-center justify-between bg-transparent">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Rendered Messages
              </span>
              {renderedMessages && (
                <div className="flex items-center gap-1.5">
                  {onSendToSimulator && (
                    <button
                      onClick={() => {
                        const allText = renderedMessages
                          .map((m) => (typeof m.content === 'object' ? JSON.stringify(m.content) : m.content))
                          .join('\n\n')
                        onSendToSimulator(allText)
                      }}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 transition-colors shadow-sm"
                      title="Send rendered prompt to AI Simulator"
                    >
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>Test in Simulator</span>
                    </button>
                  )}

                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg border border-studio-border text-slate-400 hover:text-white bg-studio-800 transition-colors shadow-sm"
                    title="Copy rendered JSON"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 p-3 overflow-auto font-mono text-xs">
              {error ? (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-400 font-medium">
                  {error}
                </div>
              ) : renderedMessages ? (
                <div className="space-y-3">
                  {renderedMessages.map((msg, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-studio-900 border border-studio-border shadow-sm">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-1.5 flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5" />
                        Role: {msg.role}
                      </div>
                      <pre className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {typeof msg.content === 'object' ? JSON.stringify(msg.content, null, 2) : msg.content}
                      </pre>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500">
                  <Play className="w-6 h-6 mb-2 opacity-40" />
                  <p className="font-medium">Ready to render prompt template.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
