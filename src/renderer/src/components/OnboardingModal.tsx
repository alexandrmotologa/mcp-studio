import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  Terminal,
  Server,
  Cpu,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Layers,
  Key,
  Flame,
  Check,
  Zap,
  Search,
  CheckSquare
} from 'lucide-react'
import { SETTINGS_KEY, LEGACY_SETTINGS_KEY } from './SettingsModal'

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenServerHub?: () => void
  onOpenDiscovery?: () => void
  onOpenSettings?: (tab?: 'vault' | 'engine' | 'about') => void
}

type OnboardingStep = 'welcome' | 'servers' | 'ai' | 'ready'

const STEPS: { id: OnboardingStep; title: string; label: string }[] = [
  { id: 'welcome', title: 'Welcome', label: '1. Overview' },
  { id: 'servers', title: 'Connect Servers', label: '2. MCP Servers' },
  { id: 'ai', title: 'AI Simulator', label: '3. AI Engine' },
  { id: 'ready', title: 'Ready to Build', label: '4. Superpowers' }
]

export const ONBOARDING_STORAGE_KEY = 'mcp_studio_onboarding_completed_v1'

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onOpenServerHub,
  onOpenDiscovery,
  onOpenSettings
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0)
  const currentStep = STEPS[currentStepIndex]?.id ?? 'welcome'

  // AI Configuration State
  const [aiMode, setAiMode] = useState<'ollama' | 'cloud'>('ollama')
  const [ollamaUrl, setOllamaUrl] = useState<string>('http://127.0.0.1:11434')
  const [ollamaStatus, setOllamaStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle')
  const [ollamaError, setOllamaError] = useState<string>('')

  // Cloud API keys state
  const [anthropicKey, setAnthropicKey] = useState<string>('')
  const [openAiKey, setOpenAiKey] = useState<string>('')
  const [geminiKey, setGeminiKey] = useState<string>('')
  const [keySaved, setKeySaved] = useState<boolean>(false)

  // Load existing settings if any
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY) || localStorage.getItem(LEGACY_SETTINGS_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed.anthropicApiKey) setAnthropicKey(parsed.anthropicApiKey)
        if (parsed.openAiApiKey) setOpenAiKey(parsed.openAiApiKey)
        if (parsed.geminiApiKey) setGeminiKey(parsed.geminiApiKey)
      }
    } catch {
      // Ignore load error
    }
  }, [isOpen])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleFinish()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentStepIndex])

  const handleFinish = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true')
    onClose()
  }

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1)
    } else {
      handleFinish()
    }
  }

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1)
    }
  }

  const testOllamaConnection = async () => {
    setOllamaStatus('checking')
    setOllamaError('')
    try {
      const res = await fetch(`${ollamaUrl.replace(/\/$/, '')}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      if (res.ok) {
        setOllamaStatus('connected')
      } else {
        setOllamaStatus('error')
        setOllamaError(`HTTP error: ${res.status}`)
      }
    } catch {
      setOllamaStatus('error')
      setOllamaError('Ollama service unreachable on port 11434. Ensure `ollama serve` is running.')
    }
  }

  const handleSaveApiKeys = () => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY) || localStorage.getItem(LEGACY_SETTINGS_KEY)
      const existing = raw ? JSON.parse(raw) : {}
      const updated = {
        ...existing,
        anthropicApiKey: anthropicKey || existing.anthropicApiKey || '',
        openAiApiKey: openAiKey || existing.openAiApiKey || '',
        geminiApiKey: geminiKey || existing.geminiApiKey || ''
      }
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))
      localStorage.setItem(LEGACY_SETTINGS_KEY, JSON.stringify(updated))
      window.dispatchEvent(new CustomEvent('mcp:settings-updated', { detail: updated }))
      window.dispatchEvent(new Event('storage'))
      setKeySaved(true)
      setTimeout(() => setKeySaved(false), 2500)
    } catch {
      // Ignore save error
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-studio-900 border border-studio-border rounded-2xl shadow-2xl overflow-hidden flex flex-col relative max-h-[92vh]">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500" />
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-36 bg-indigo-500/15 blur-3xl pointer-events-none rounded-full" />

        {/* Modal Topbar: Brand, Stepper & Skip */}
        <div className="px-6 py-4 border-b border-studio-border/80 flex items-center justify-between flex-shrink-0 bg-studio-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-500/25 ring-1 ring-white/20">
              <Terminal className="w-3.5 h-3.5 text-white font-bold" />
            </div>
            <span className="font-bold text-sm text-white tracking-tight">MCP Studio Quickstart</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Step Indicators */}
            <div className="flex items-center gap-1.5">
              {STEPS.map((step, idx) => (
                <button
                  key={step.id}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentStepIndex
                      ? 'w-6 bg-indigo-500 shadow-sm shadow-indigo-500/50'
                      : idx < currentStepIndex
                        ? 'w-2 bg-indigo-400/60'
                        : 'w-2 bg-slate-700'
                  }`}
                  title={step.title}
                />
              ))}
            </div>

            <button
              onClick={handleFinish}
              className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-studio-800 transition-colors font-medium ml-2"
            >
              Skip Tour
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto min-h-[380px] flex-1">
          {/* STEP 1: WELCOME & OVERVIEW */}
          {currentStep === 'welcome' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center space-y-2 max-w-lg mx-auto">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold tracking-wide uppercase">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  Model Context Protocol IDE
                </div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">
                  Welcome to Your MCP Command Center
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  MCP Studio is an enterprise-grade desktop suite designed to test, debug, inspect, and benchmark Model Context Protocol servers in real-time.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-4 rounded-xl bg-studio-950/80 border border-studio-border space-y-2 hover:border-indigo-500/40 transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-200">Dynamic Tool Runner</h3>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Auto-generated forms from JSON Schema, smart mock auto-filler, and multi-view responses (Tree, Table, Markdown, Media).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-studio-950/80 border border-studio-border space-y-2 hover:border-cyan-500/40 transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-200">Live JSON-RPC Bus</h3>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Real-time bidirectional packet inspector with millisecond latency timings, visual diffs, and 1-click replaying.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-studio-950/80 border border-studio-border space-y-2 hover:border-purple-500/40 transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-200">Multi-LLM Simulator</h3>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Simulate autonomous multi-turn tool discovery using local Ollama or Frontier LLMs (Claude, GPT-4o, Gemini).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CONNECTING SERVERS */}
          {currentStep === 'servers' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-indigo-400" />
                  Connect Your First MCP Server
                </h2>
                <p className="text-xs text-slate-400">
                  MCP Studio connects to any subprocess using stdio (Node, Python, Go, Rust) or remote SSE endpoints.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1-Click Server Hub */}
                <div className="p-4 rounded-xl bg-studio-950 border border-studio-border space-y-3 flex flex-col justify-between hover:border-indigo-500/50 transition-colors">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-amber-400" />
                        Official Server Hub
                      </span>
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                        1-Click Launch
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Instant templates for popular MCP servers: PostgreSQL, Filesystem, GitHub, SQLite, Puppeteer, Brave Search, Memory, and Fetch.
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {['Postgres', 'Filesystem', 'GitHub', 'Puppeteer', 'SQLite'].map((tag) => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-studio-900 border border-studio-border text-slate-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      handleFinish()
                      if (onOpenServerHub) onOpenServerHub()
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5"
                  >
                    <span>Browse Server Hub</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Auto Discovery */}
                <div className="p-4 rounded-xl bg-studio-950 border border-studio-border space-y-3 flex flex-col justify-between hover:border-cyan-500/50 transition-colors">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Search className="w-4 h-4 text-cyan-400" />
                        Auto-Discovery
                      </span>
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                        Claude &amp; Cursor
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Already using MCP in Claude Desktop or Cursor? Studio scans your local config files to import your existing servers in one click.
                    </p>
                    <div className="p-2 rounded-lg bg-studio-900/80 border border-studio-border/60 text-[10px] text-slate-400 font-mono">
                      claude_desktop_config.json
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      handleFinish()
                      if (onOpenDiscovery) onOpenDiscovery()
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-studio-800 hover:bg-studio-700 text-slate-200 hover:text-white border border-studio-border text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Scan Existing Configs</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2.5 text-xs text-indigo-300">
                <CheckSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>You can also manually add any server anytime using the <strong>+ Add Server</strong> button in the left sidebar.</span>
              </div>
            </div>
          )}

          {/* STEP 3: AI SIMULATOR SETUP */}
          {currentStep === 'ai' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-purple-400" />
                  Configure AI Simulation Engine
                </h2>
                <p className="text-xs text-slate-400">
                  The AI Simulator executes autonomous loops against your MCP tools. Choose between a 100% offline local model (Ollama) or Frontier cloud APIs.
                </p>
              </div>

              {/* Mode Selector Tabs */}
              <div className="flex rounded-xl bg-studio-950 p-1 border border-studio-border">
                <button
                  type="button"
                  onClick={() => setAiMode('ollama')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                    aiMode === 'ollama'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Local Ollama (Offline &amp; Free)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAiMode('cloud')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                    aiMode === 'cloud'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Cloud API Keys (Claude, GPT, Gemini)</span>
                </button>
              </div>

              {/* Ollama Panel */}
              {aiMode === 'ollama' && (
                <div className="p-4 rounded-xl bg-studio-950 border border-studio-border space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">Local Ollama Daemon</h4>
                      <p className="text-[11px] text-slate-400">Default endpoint: http://127.0.0.1:11434</p>
                    </div>
                    <button
                      type="button"
                      onClick={testOllamaConnection}
                      disabled={ollamaStatus === 'checking'}
                      className="px-3 py-1.5 rounded-lg bg-studio-800 hover:bg-studio-700 border border-studio-border text-xs font-medium text-slate-200 hover:text-white transition-colors flex items-center gap-1.5"
                    >
                      {ollamaStatus === 'checking' ? (
                        <>
                          <span className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                          <span>Testing...</span>
                        </>
                      ) : (
                        <span>Test Connection</span>
                      )}
                    </button>
                  </div>

                  <input
                    type="text"
                    value={ollamaUrl}
                    onChange={(e) => setOllamaUrl(e.target.value)}
                    placeholder="http://127.0.0.1:11434"
                    className="w-full bg-studio-900 border border-studio-border rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                  />

                  {/* Connection Status Feedback */}
                  {ollamaStatus === 'connected' && (
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Ollama is online and reachable! You can start simulating tools immediately.</span>
                    </div>
                  )}

                  {ollamaStatus === 'error' && (
                    <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 space-y-1 text-xs text-red-300">
                      <div className="flex items-center gap-1.5 font-bold text-red-200">
                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                        <span>{ollamaError || 'Connection failed'}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Ensure Ollama is running in your terminal: <code className="text-purple-300 font-mono bg-studio-900 px-1 py-0.5 rounded">ollama serve</code> and you have a model pulled: <code className="text-purple-300 font-mono bg-studio-900 px-1 py-0.5 rounded">ollama run llama3:8b</code>.
                      </p>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <span>Don't have Ollama yet?</span>
                    <button
                      type="button"
                      onClick={() => window.api.shell.openExternal('https://ollama.com')}
                      className="text-purple-400 hover:underline inline-flex items-center gap-0.5 font-medium"
                    >
                      Download free from ollama.com <ExternalLink className="w-2.5 h-2.5 inline" />
                    </button>
                  </div>
                </div>
              )}

              {/* Cloud API Keys Panel */}
              {aiMode === 'cloud' && (
                <div className="p-4 rounded-xl bg-studio-950 border border-studio-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">Encrypted API Key Vault</h4>
                      <p className="text-[11px] text-slate-400">Keys are encrypted with OS Keychain / DPAPI and stored locally.</p>
                    </div>
                    {onOpenSettings && (
                      <button
                        type="button"
                        onClick={() => {
                          handleFinish()
                          onOpenSettings('vault')
                        }}
                        className="text-xs text-indigo-400 hover:underline font-medium inline-flex items-center gap-1"
                      >
                        All Providers in Settings <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="text-slate-300 block mb-1 font-medium">Anthropic API Key (Claude 3.7 Sonnet / 3.5)</label>
                      <input
                        type="password"
                        value={anthropicKey}
                        onChange={(e) => setAnthropicKey(e.target.value)}
                        placeholder="sk-ant-api03-..."
                        className="w-full bg-studio-900 border border-studio-border rounded-lg px-3 py-1.5 font-mono text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 block mb-1 font-medium">OpenAI API Key (GPT-4o / o3-mini)</label>
                      <input
                        type="password"
                        value={openAiKey}
                        onChange={(e) => setOpenAiKey(e.target.value)}
                        placeholder="sk-..."
                        className="w-full bg-studio-900 border border-studio-border rounded-lg px-3 py-1.5 font-mono text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 block mb-1 font-medium">Google Gemini API Key (Gemini 2.0 Flash / Pro)</label>
                      <input
                        type="password"
                        value={geminiKey}
                        onChange={(e) => setGeminiKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full bg-studio-900 border border-studio-border rounded-lg px-3 py-1.5 font-mono text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">You can also leave these blank and configure later in Settings.</span>
                    <button
                      type="button"
                      onClick={handleSaveApiKeys}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
                    >
                      {keySaved ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Saved!</span>
                        </>
                      ) : (
                        <span>Save to Vault</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: READY & PRO-TIPS */}
          {currentStep === 'ready' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center space-y-1 max-w-md mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/25 ring-1 ring-white/20 mb-2">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  You're Ready to Build!
                </h2>
                <p className="text-xs text-slate-400">
                  Here are 3 essential pro-tips to help you get the most out of MCP Studio:
                </p>
              </div>

              <div className="space-y-2.5 max-w-lg mx-auto pt-1">
                <div className="p-3 rounded-xl bg-studio-950 border border-studio-border flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 font-mono text-xs font-bold shrink-0 mt-0.5">
                    Ctrl+K
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">Global Command Palette</h4>
                    <p className="text-[11px] text-slate-400">Press <kbd className="text-[10px] font-mono px-1 py-0.2 rounded bg-studio-900 border border-studio-border text-slate-300">Ctrl+K</kbd> anywhere to access any tool, action, or server instantly.</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-studio-950 border border-studio-border flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold shrink-0 mt-0.5">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">Live Bottom Console &amp; Traffic Drawer</h4>
                    <p className="text-[11px] text-slate-400">Click the drawer bar at the bottom to inspect live subprocess <code className="text-slate-300 font-mono">stderr</code> logs and raw JSON-RPC traffic.</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-studio-950 border border-studio-border flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 font-bold shrink-0 mt-0.5">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">15 Developer Power Tools</h4>
                    <p className="text-[11px] text-slate-400">Explore Test Suites, Concurrency Benchmarks, Security Scanner, OpenAPI Transpiler, and Schema Diffs in the header menu.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer: Navigation Controls */}
        <div className="px-6 py-4 border-t border-studio-border/80 flex items-center justify-between flex-shrink-0 bg-studio-950/40">
          <div>
            {currentStepIndex > 0 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-3.5 py-1.5 rounded-xl bg-studio-800 hover:bg-studio-700 border border-studio-border text-xs text-slate-300 hover:text-white font-medium transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <span className="text-xs text-slate-500 font-medium">Step 1 of 4</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStepIndex < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/25 flex items-center gap-1.5"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Start Exploring MCP Studio</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
