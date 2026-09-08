import React, { useState, useEffect } from 'react'
import {
  X,
  Settings,
  Key,
  Clock,
  Save,
  Check,
  Globe,
  ExternalLink,
  RefreshCw,
  Download,
  Info,
  Mail,
  Heart,
  Cpu,
  Terminal,
  Copy,
  LifeBuoy,
  Sparkles
} from 'lucide-react'
import { dispatchNotification } from '../utils/notificationDispatcher'

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
)

export type SettingsTab = 'vault' | 'engine' | 'about'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: SettingsTab
  onReplayOnboarding?: () => void
}

export const SETTINGS_KEY = 'mcp_studio_global_settings_v1'
export const LEGACY_SETTINGS_KEY = 'mcp_studio_settings_v1'

export interface StudioSettings {
  anthropicApiKey: string
  openAiApiKey: string
  deepSeekApiKey: string
  groqApiKey: string
  xAiApiKey: string
  mistralApiKey: string
  qwenApiKey: string
  openRouterApiKey: string
  geminiApiKey: string
  ollamaBaseUrl: string
  customBaseUrl: string
  requestTimeoutSeconds: number
  autoReconnectOnStart: boolean
}

export const defaultSettings: StudioSettings = {
  anthropicApiKey: '',
  openAiApiKey: '',
  deepSeekApiKey: '',
  groqApiKey: '',
  xAiApiKey: '',
  mistralApiKey: '',
  qwenApiKey: '',
  openRouterApiKey: '',
  geminiApiKey: '',
  ollamaBaseUrl: 'http://localhost:11434',
  customBaseUrl: 'http://localhost:8000/v1',
  requestTimeoutSeconds: 30,
  autoReconnectOnStart: true
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'vault',
  onReplayOnboarding
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab)
  const [settings, setSettings] = useState<StudioSettings>(defaultSettings)
  const [saved, setSaved] = useState(false)
  const [appVersion, setAppVersion] = useState('2.1.8')
  const [appInfo, setAppInfo] = useState<{
    version: string
    name: string
    electron?: string
    chrome?: string
    node?: string
    platform?: string
    arch?: string
  } | null>(null)
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [updateInfo, setUpdateInfo] = useState<{
    status: string
    version?: string
    percent?: number
    error?: string
  }>({ status: 'idle' })
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveTab(initialTab)
      }

      try {
        const stored = localStorage.getItem(SETTINGS_KEY) || localStorage.getItem(LEGACY_SETTINGS_KEY)
        if (stored) {
          setSettings({ ...defaultSettings, ...JSON.parse(stored) })
        }
      } catch {
        // fallback
      }

      if (window.api?.app?.getVersion) {
        window.api.app.getVersion().then((v) => {
          if (v) setAppVersion(v)
        }).catch(() => {})
      }

      if (window.api?.app?.getInfo) {
        window.api.app.getInfo().then(setAppInfo).catch(() => {})
      }

      if (window.api?.updater) {
        window.api.updater.getStatus().then(setUpdateInfo).catch(() => {})
        const unsub = window.api.updater.onUpdateStatus((status) => {
          setUpdateInfo(status)
          setIsCheckingUpdate(false)
        })
        return () => unsub()
      }
    }
  }, [isOpen, initialTab])

  const handleCheckForUpdates = async () => {
    if (!window.api?.updater) return
    setIsCheckingUpdate(true)
    try {
      const res = await window.api.updater.checkForUpdates()
      setUpdateInfo(res)
      if (res.status === 'not-available') {
        dispatchNotification({
          title: 'MCP Studio is Up to Date',
          message: 'You are running the latest version of MCP Studio.',
          type: 'info',
          category: 'updater'
        })
      }
    } catch (err: any) {
      setUpdateInfo({ status: 'error', error: err?.message || 'Failed to check for updates' })
      dispatchNotification({
        title: 'Update Check Failed',
        message: err?.message || 'Failed to check for updates.',
        type: 'error',
        category: 'updater'
      })
    } finally {
      setIsCheckingUpdate(false)
    }
  }

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText('support@mtlglabs.space')
    setCopiedEmail(true)
    setTimeout(() => setCopiedEmail(false), 2000)
  }

  if (!isOpen) return null

  const handleSave = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    localStorage.setItem(LEGACY_SETTINGS_KEY, JSON.stringify(settings))
    window.dispatchEvent(new CustomEvent('mcp:settings-updated', { detail: settings }))
    window.dispatchEvent(new Event('storage'))
    dispatchNotification({
      title: 'Settings Saved',
      message: 'API key vault, execution timeouts, and connection preferences updated successfully.',
      type: 'success',
      category: 'settings'
    })
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      onClose()
    }, 1200)
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-studio-900 border border-studio-border rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-studio-border bg-studio-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shadow-sm">
              <Settings className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Studio Settings &amp; Preferences</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-mono font-bold">
                  v{appVersion}
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Configure Frontier LLM API keys, protocol execution parameters, or view about details.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-2 border-b border-studio-border bg-studio-950/40 flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('vault')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-t-xl border-t border-x transition-all ${
              activeTab === 'vault'
                ? 'bg-studio-900 border-studio-border text-indigo-400 border-b-2 border-b-studio-900 -mb-[1px] shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-studio-900/40'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>API Key Vault</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('engine')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-t-xl border-t border-x transition-all ${
              activeTab === 'engine'
                ? 'bg-studio-900 border-studio-border text-cyan-400 border-b-2 border-b-studio-900 -mb-[1px] shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-studio-900/40'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Engine &amp; Timeout</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('about')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-t-xl border-t border-x transition-all ${
              activeTab === 'about'
                ? 'bg-studio-900 border-studio-border text-purple-400 border-b-2 border-b-studio-900 -mb-[1px] shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-studio-900/40'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>About &amp; Support</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
              v{appVersion}
            </span>
          </button>
        </div>

        {/* Tab 1: LLM API Key Vault */}
        {activeTab === 'vault' && (
          <div className="p-6 overflow-y-auto overflow-x-hidden space-y-6 flex-1 bg-transparent min-w-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" />
                  <span>LLM API Key Vault (Stored Securely on Device)</span>
                </h4>
                <span className="text-[11px] text-slate-400 font-medium">Encrypted via OS storage</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Anthropic Claude API Key
                  </label>
                  <input
                    type="password"
                    value={settings.anthropicApiKey}
                    onChange={(e) => setSettings({ ...settings, anthropicApiKey: e.target.value })}
                    placeholder="sk-ant-api03-..."
                    className="w-full bg-studio-950 border border-studio-border rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 shadow-sm font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    OpenAI API Key
                  </label>
                  <input
                    type="password"
                    value={settings.openAiApiKey}
                    onChange={(e) => setSettings({ ...settings, openAiApiKey: e.target.value })}
                    placeholder="sk-proj-..."
                    className="w-full bg-studio-950 border border-studio-border rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 shadow-sm font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    DeepSeek API Key
                  </label>
                  <input
                    type="password"
                    value={settings.deepSeekApiKey}
                    onChange={(e) => setSettings({ ...settings, deepSeekApiKey: e.target.value })}
                    placeholder="sk-..."
                    className="w-full bg-studio-950 border border-studio-border rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 shadow-sm font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Groq API Key (Ultra-Fast Llama/R1)
                  </label>
                  <input
                    type="password"
                    value={settings.groqApiKey}
                    onChange={(e) => setSettings({ ...settings, groqApiKey: e.target.value })}
                    placeholder="gsk_..."
                    className="w-full bg-studio-950 border border-studio-border rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 shadow-sm font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    xAI Grok API Key
                  </label>
                  <input
                    type="password"
                    value={settings.xAiApiKey}
                    onChange={(e) => setSettings({ ...settings, xAiApiKey: e.target.value })}
                    placeholder="xai-..."
                    className="w-full bg-studio-950 border border-studio-border rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 shadow-sm font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Mistral AI API Key
                  </label>
                  <input
                    type="password"
                    value={settings.mistralApiKey}
                    onChange={(e) => setSettings({ ...settings, mistralApiKey: e.target.value })}
                    placeholder="Enter Mistral key"
                    className="w-full bg-studio-950 border border-studio-border rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 shadow-sm font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Alibaba Qwen API Key (DashScope)
                  </label>
                  <input
                    type="password"
                    value={settings.qwenApiKey}
                    onChange={(e) => setSettings({ ...settings, qwenApiKey: e.target.value })}
                    placeholder="sk-..."
                    className="w-full bg-studio-950 border border-studio-border rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 shadow-sm font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    OpenRouter API Key (200+ Models)
                  </label>
                  <input
                    type="password"
                    value={settings.openRouterApiKey}
                    onChange={(e) => setSettings({ ...settings, openRouterApiKey: e.target.value })}
                    placeholder="sk-or-v1-..."
                    className="w-full bg-studio-950 border border-studio-border rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 shadow-sm font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Google Gemini API Key
                  </label>
                  <input
                    type="password"
                    value={settings.geminiApiKey}
                    onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                    placeholder="AIzaSy..."
                    className="w-full bg-studio-950 border border-studio-border rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 shadow-sm font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Ollama Local URL
                  </label>
                  <input
                    type="text"
                    value={settings.ollamaBaseUrl}
                    onChange={(e) => setSettings({ ...settings, ollamaBaseUrl: e.target.value })}
                    placeholder="http://localhost:11434"
                    className="w-full bg-studio-950 border border-studio-border rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 shadow-sm font-medium"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Custom Provider Base URL (Xiaomi MiMO, Cloudflare AI, vLLM, LMStudio)
                  </label>
                  <input
                    type="text"
                    value={settings.customBaseUrl}
                    onChange={(e) => setSettings({ ...settings, customBaseUrl: e.target.value })}
                    placeholder="https://api.cloudflare.com/... or http://localhost:8000/v1"
                    className="w-full bg-studio-950 border border-studio-border rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 shadow-sm font-medium"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Protocol Execution & Timeout */}
        {activeTab === 'engine' && (
          <div className="p-6 overflow-y-auto overflow-x-hidden space-y-6 flex-1 bg-transparent min-w-0">
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Protocol Execution &amp; Client Timeout</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-studio-950 border border-studio-border space-y-2">
                  <label className="text-xs font-bold text-slate-200 block">
                    JSON-RPC Request Timeout
                  </label>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Maximum time to await tool responses or schema inspection before terminating the call.
                  </p>
                  <select
                    value={settings.requestTimeoutSeconds}
                    onChange={(e) =>
                      setSettings({ ...settings, requestTimeoutSeconds: parseInt(e.target.value) })
                    }
                    className="w-full bg-studio-900 border border-studio-border rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 shadow-sm font-medium mt-1"
                  >
                    <option value={15}>15 Seconds (Fast fail)</option>
                    <option value={30}>30 Seconds (Standard Default)</option>
                    <option value={60}>60 Seconds (Heavy Tools / LLM calls)</option>
                    <option value={120}>120 Seconds (Long-running jobs)</option>
                    <option value={0}>No Timeout (Infinite await)</option>
                  </select>
                </div>

                <div className="p-4 rounded-xl bg-studio-950 border border-studio-border space-y-2">
                  <label className="text-xs font-bold text-slate-200 block">
                    Auto-Reconnect on Launch
                  </label>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Automatically spawn child processes and connect enabled servers on app start.
                  </p>
                  <select
                    value={settings.autoReconnectOnStart ? 'yes' : 'no'}
                    onChange={(e) =>
                      setSettings({ ...settings, autoReconnectOnStart: e.target.value === 'yes' })
                    }
                    className="w-full bg-studio-900 border border-studio-border rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 shadow-sm font-medium mt-1"
                  >
                    <option value="yes">Enabled (Auto-connect all configured servers)</option>
                    <option value="no">Disabled (Manual connect via Sidebar)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: About & Support */}
        {activeTab === 'about' && (
          <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-transparent">
            {/* Hero App Banner */}
            <div className="relative overflow-hidden rounded-2xl p-6 sm:p-7 border border-indigo-500/30 bg-gradient-to-br from-indigo-950/65 via-purple-950/40 to-studio-950 shadow-xl shadow-indigo-950/40 backdrop-blur-xl transition-all duration-300 hover:border-indigo-500/45 min-w-0">
              {/* Decorative ambient background glows */}
              <div className="absolute -top-16 -right-16 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.015] to-transparent pointer-events-none" />

              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
                {/* Glowing App Logo Icon */}
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl p-[1.5px] bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 shadow-xl shadow-indigo-500/25 shrink-0 flex items-center justify-center">
                  <div className="w-full h-full bg-studio-950/90 rounded-[14px] flex items-center justify-center backdrop-blur-md">
                    <Terminal className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                  </div>
                </div>

                {/* Banner Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      MCP Studio
                    </h3>
                    <span className="px-3 py-0.5 text-xs font-mono font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/35 shadow-sm">
                      v{appVersion} Enterprise
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Stable</span>
                    </span>
                  </div>

                  <p className="text-xs sm:text-[13px] text-slate-300 mt-2 leading-relaxed font-normal max-w-2xl">
                    Next-Gen Enterprise Desktop IDE, Multi-LLM AI Simulator &amp; Developer Suite for the Model Context Protocol (MCP).
                  </p>

                  {/* Architecture & Tech Stack Micro-Pills */}
                  <div className="flex items-center gap-2 mt-4 flex-wrap">
                    <div className="px-2.5 py-1 rounded-lg bg-studio-900/90 border border-studio-border/80 text-[11px] font-mono text-slate-300 flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span>Electron 34</span>
                    </div>
                    <div className="px-2.5 py-1 rounded-lg bg-studio-900/90 border border-studio-border/80 text-[11px] font-mono text-slate-300 flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      <span>React 19 &amp; TypeScript</span>
                    </div>
                    <div className="px-2.5 py-1 rounded-lg bg-studio-900/90 border border-studio-border/80 text-[11px] font-mono text-slate-300 flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      <span>MCP SDK 1.5+</span>
                    </div>
                    <div className="px-2.5 py-1 rounded-lg bg-studio-900/90 border border-studio-border/80 text-[11px] font-mono text-slate-300 flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>TailwindCSS</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Author & Organization Card */}
            <div className="bg-studio-950 border border-studio-border rounded-2xl p-4 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <span>Author &amp; Organization</span>
                </h4>
                <span className="text-[11px] text-slate-400 font-medium">Architecture &amp; Design</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-xl bg-studio-900 border border-studio-border/70 flex flex-col justify-between gap-2.5 overflow-hidden">
                  <div>
                    <div className="text-xs font-bold text-white">Alexandr Motologa</div>
                    <p className="text-[11px] text-slate-400">Creator &amp; Principal Software Architect</p>
                  </div>
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => window.api.shell.openExternal('https://mtlg.site')}
                      className="px-2.5 py-1 rounded-lg bg-studio-950 hover:bg-studio-800 border border-studio-border text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 text-[11px] font-bold transition-colors shrink-0"
                    >
                      <Globe className="w-3 h-3 text-indigo-400" />
                      <span>mtlg.site</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </button>
                    <button
                      type="button"
                      onClick={() => window.api.shell.openExternal('https://github.com/alexandrmotologa')}
                      className="px-2.5 py-1 rounded-lg bg-studio-950 hover:bg-studio-800 border border-studio-border text-slate-300 hover:text-white flex items-center gap-1.5 text-[11px] font-medium transition-colors shrink-0"
                    >
                      <GithubIcon className="w-3 h-3" />
                      <span>GitHub</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-studio-900 border border-studio-border/70 flex flex-col justify-between gap-2.5 overflow-hidden">
                  <div>
                    <div className="text-xs font-bold text-white">MTLG Labs</div>
                    <p className="text-[11px] text-slate-400">Software Studio &amp; AI Product Engineering</p>
                  </div>
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => window.api.shell.openExternal('https://mtlglabs.space')}
                      className="px-2.5 py-1 rounded-lg bg-studio-950 hover:bg-studio-800 border border-studio-border text-purple-400 hover:text-purple-300 flex items-center gap-1.5 text-[11px] font-bold transition-colors shrink-0"
                      title="https://mtlglabs.space"
                    >
                      <Globe className="w-3 h-3 text-purple-400" />
                      <span>mtlglabs.space</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </button>
                    <button
                      type="button"
                      onClick={() => window.api.shell.openExternal('https://mcp.mtlglabs.space')}
                      className="px-2.5 py-1 rounded-lg bg-studio-950 hover:bg-studio-800 border border-studio-border text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 text-[11px] font-bold transition-colors shrink-0"
                      title="https://mcp.mtlglabs.space"
                    >
                      <Globe className="w-3 h-3 text-cyan-400" />
                      <span>MCP Studio</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Repositories & Community Card */}
            <div className="bg-studio-950 border border-studio-border rounded-2xl p-4 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <GithubIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Official GitHub &amp; Issue Tracking</span>
                </h4>
                <span className="text-[11px] text-slate-400 font-mono">Open Distribution</span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Releases, bug reports, feature discussions, and documentation are hosted on GitHub.
              </p>

              <div className="flex items-center gap-2 flex-wrap text-xs">
                <button
                  type="button"
                  onClick={() => window.api.shell.openExternal('https://github.com/alexandrmotologa/mcp-studio')}
                  className="px-3 py-1.5 rounded-xl bg-studio-900 hover:bg-studio-850 border border-studio-border text-white flex items-center gap-2 font-bold transition-colors"
                >
                  <GithubIcon className="w-3.5 h-3.5 text-slate-300" />
                  <span>alexandrmotologa/mcp-studio</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={() => window.api.shell.openExternal('https://github.com/alexandrmotologa/mcp-studio/issues')}
                  className="px-3 py-1.5 rounded-xl bg-studio-900 hover:bg-studio-850 border border-studio-border text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors font-medium"
                >
                  <span>Report an Issue</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </button>
                <button
                  type="button"
                  onClick={() => window.api.shell.openExternal('https://github.com/alexandrmotologa/mcp-studio/releases')}
                  className="px-3 py-1.5 rounded-xl bg-studio-900 hover:bg-studio-850 border border-studio-border text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors font-medium"
                >
                  <span>Release Notes</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </button>
              </div>
            </div>

            {/* Direct Support Desk Card */}
            <div className="bg-studio-950 border border-studio-border rounded-2xl p-4 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <LifeBuoy className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Direct Support &amp; Inquiries</span>
                </h4>
                <span className="text-[11px] text-slate-400">Direct Desk</span>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl bg-studio-900/80 border border-studio-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-white">support@mtlglabs.space</div>
                    <p className="text-[11px] text-slate-400">Technical support, feedback, and enterprise licensing</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() =>
                      window.api.shell.openExternal(
                        `mailto:support@mtlglabs.space?subject=MCP%20Studio%20Support%20(v${appVersion})`
                      )
                    }
                    className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Mail className="w-3 h-3" />
                    <span>Send Email</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="px-2.5 py-1.5 rounded-lg bg-studio-800 hover:bg-studio-700 text-slate-300 text-xs font-medium border border-studio-border flex items-center justify-center gap-1.5 transition-colors"
                    title="Copy email to clipboard"
                  >
                    {copiedEmail ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedEmail ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Runtime Diagnostics */}
            <div className="bg-studio-950 border border-studio-border rounded-2xl p-3.5 space-y-2 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                <span>Runtime Environment &amp; System Info</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
                <div className="p-2 rounded-xl bg-studio-900 border border-studio-border/60">
                  <div className="text-[10px] text-slate-400 uppercase">Version</div>
                  <div className="text-xs font-bold text-white mt-0.5">v{appVersion}</div>
                </div>
                <div className="p-2 rounded-xl bg-studio-900 border border-studio-border/60">
                  <div className="text-[10px] text-slate-400 uppercase">Electron</div>
                  <div className="text-xs font-bold text-slate-200 mt-0.5">{appInfo?.electron || '34.0.0'}</div>
                </div>
                <div className="p-2 rounded-xl bg-studio-900 border border-studio-border/60">
                  <div className="text-[10px] text-slate-400 uppercase">Chromium</div>
                  <div className="text-xs font-bold text-slate-200 mt-0.5">
                    {appInfo?.chrome?.split('.')[0] || '132'}.x
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-studio-900 border border-studio-border/60">
                  <div className="text-[10px] text-slate-400 uppercase">Platform</div>
                  <div className="text-xs font-bold text-slate-200 mt-0.5">
                    {appInfo?.platform || 'os'}-{appInfo?.arch || 'x64'}
                  </div>
                </div>
              </div>
            </div>

            {/* Release Channel & Auto-Updater */}
            <div className="bg-studio-950 p-3.5 rounded-2xl border border-studio-border flex items-center justify-between gap-3 text-xs shadow-sm">
              <div className="flex items-center gap-2.5">
                <RefreshCw
                  className={`w-4 h-4 text-cyan-400 shrink-0 ${isCheckingUpdate ? 'animate-spin' : ''}`}
                />
                <div>
                  <span className="font-semibold text-slate-200 text-xs">Release Channel &amp; Updates</span>
                  <p className="text-[11px] text-slate-400">
                    {updateInfo.status === 'checking' && 'Checking GitHub Releases for updates...'}
                    {updateInfo.status === 'available' &&
                      `Update available (${updateInfo.version}). Downloading in background...`}
                    {updateInfo.status === 'downloading' && `Downloading update: ${updateInfo.percent || 0}%`}
                    {updateInfo.status === 'downloaded' &&
                      `Update ready (${updateInfo.version}). Restart to apply.`}
                    {updateInfo.status === 'not-available' && (
                      <span>
                        MCP Studio is up to date (v{appVersion}).{' '}
                        <button
                          type="button"
                          onClick={() =>
                            window.api.shell.openExternal(
                              'https://github.com/alexandrmotologa/mcp-studio/releases'
                            )
                          }
                          className="text-indigo-400 hover:underline inline-flex items-center gap-0.5 ml-0.5"
                        >
                          View Releases <ExternalLink className="w-2.5 h-2.5 inline" />
                        </button>
                      </span>
                    )}
                    {updateInfo.status === 'error' && (updateInfo.error || 'Check completed.')}
                    {updateInfo.status === 'idle' &&
                      `Automatic updates enabled via GitHub Releases (Current: v${appVersion}).`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {updateInfo.status === 'downloaded' ? (
                  <button
                    type="button"
                    onClick={() => window.api.updater?.quitAndInstall()}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Restart &amp; Update</span>
                  </button>
                ) : updateInfo.status === 'available' ? (
                  <button
                    type="button"
                    onClick={() =>
                      window.api.shell.openExternal(
                        'https://github.com/alexandrmotologa/mcp-studio/releases/latest'
                      )
                    }
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download v{updateInfo.version}</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isCheckingUpdate}
                    onClick={handleCheckForUpdates}
                    className="px-3 py-1.5 rounded-xl bg-studio-900 hover:bg-studio-850 border border-studio-border text-slate-300 hover:text-white font-bold text-xs transition-colors disabled:opacity-50"
                  >
                    {isCheckingUpdate ? 'Checking...' : 'Check for Updates'}
                  </button>
                )}
              </div>
            </div>

            {/* First-Run Onboarding Tour Replay */}
            {onReplayOnboarding && (
              <div className="bg-studio-950 p-3.5 rounded-2xl border border-studio-border flex items-center justify-between gap-3 text-xs shadow-sm">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-200 text-xs">First-Run Welcome Tour</span>
                    <p className="text-[11px] text-slate-400">
                      Replay the interactive onboarding guide covering server setup and AI configuration.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onReplayOnboarding()
                  }}
                  className="px-3 py-1.5 rounded-xl bg-studio-900 hover:bg-studio-800 border border-studio-border text-amber-300 hover:text-amber-200 font-bold text-xs transition-colors shrink-0 flex items-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Replay Tour</span>
                </button>
              </div>
            )}

            {/* Legal & Copyright */}
            <div className="text-center pt-2 pb-1 space-y-1 text-slate-500">
              <p className="text-[11px]">
                Copyright &copy; 2025&ndash;2026 MTLG Labs &amp; Alexandr Motologa. All rights reserved.
              </p>
              <p className="text-[10px] text-slate-600">
                Model Context Protocol (MCP) is an open specification spearheaded by Anthropic.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-studio-border bg-studio-950 flex items-center justify-end gap-2 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-studio-800 hover:bg-studio-700 text-slate-300 text-xs font-bold transition-colors"
          >
            {activeTab === 'about' ? 'Close' : 'Cancel'}
          </button>

          {activeTab !== 'about' && (
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-colors"
            >
              {saved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
              <span>{saved ? 'Saved!' : 'Save Settings'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
