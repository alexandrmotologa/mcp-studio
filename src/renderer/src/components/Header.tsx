import React, { useState, useEffect, useRef } from 'react'
import {
  Search,
  Layers,
  Cpu,
  FileCode2,
  MessageSquare,
  Activity,
  BarChart3,
  Wrench,
  Globe,
  Bell,
  Settings,
  Palette,
  Volume2,
  VolumeX,
  Keyboard,
  Bookmark,
  Sparkles,
  RefreshCw,
  Info
} from 'lucide-react'
import { LicenseStatus, EnvironmentProfile } from '../../../shared/types'
import { isSoundEnabled, setSoundEnabled, playClickSound } from '../utils/soundEngine'

interface HeaderProps {
  activeTab: 'tools' | 'resources' | 'prompts' | 'simulator' | 'traffic' | 'analytics'
  setActiveTab: (tab: 'tools' | 'resources' | 'prompts' | 'simulator' | 'traffic' | 'analytics') => void
  license: LicenseStatus
  activeEnvironment?: EnvironmentProfile
  onOpenLicenseModal: () => void
  onOpenEnvironmentsModal: () => void
  onOpenCollectionsDrawer: () => void
  onOpenCommandPalette?: () => void
  onOpenSettingsModal?: (tab?: 'vault' | 'engine' | 'about') => void
  onOpenShortcutsModal?: () => void
  onOpenThemeModal?: () => void
  onOpenNotifications?: () => void
  onOpenToolkit?: () => void
  onOpenOnboarding?: () => void
  unreadNotificationsCount?: number
}

export const Header: React.FC<HeaderProps> = React.memo(({
  activeTab,
  setActiveTab,
  license,
  activeEnvironment,
  onOpenLicenseModal,
  onOpenEnvironmentsModal,
  onOpenCollectionsDrawer,
  onOpenCommandPalette,
  onOpenSettingsModal,
  onOpenShortcutsModal,
  onOpenThemeModal,
  onOpenNotifications,
  onOpenToolkit,
  onOpenOnboarding,
  unreadNotificationsCount = 0
}) => {
  const [soundOn, setSoundOn] = useState(isSoundEnabled())
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false)
  const [appVersion, setAppVersion] = useState('2.0.3')
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.api?.app?.getVersion) {
      window.api.app.getVersion().then((v) => {
        if (v) setAppVersion(v)
      }).catch(() => {})
    }
  }, [])

  const toggleSound = () => {
    const next = !soundOn
    setSoundOn(next)
    setSoundEnabled(next)
    if (next) playClickSound()
  }

  // Click outside to close preferences popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsPreferencesOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsPreferencesOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <header className="h-14 border-b border-studio-border bg-studio-900/90 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between z-20 flex-shrink-0 relative">
      {/* 1. Left: Brand & Search Omnibar */}
      <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0 min-w-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-studio-950 border border-studio-border p-1 shadow-md shadow-indigo-500/10 shrink-0 flex items-center justify-center relative overflow-hidden group hover:border-indigo-500/50 transition-colors">
            <svg className="w-full h-full" viewBox="0 0 160 160" fill="none">
              <path d="M60 54L38 80L60 106" stroke="#6366F1" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M100 54L122 80L100 106" stroke="#06B6D4" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M68 80H92" stroke="#FFFFFF" strokeWidth="12" strokeLinecap="round"/>
              <circle cx="80" cy="80" r="5" fill="#8B5CF6"/>
            </svg>
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="font-bold tracking-tight studio-brand-title text-sm whitespace-nowrap">
              MCP Studio
            </span>
            {license.isPro ? (
              <span className="px-1.5 py-0.2 text-[9px] font-semibold tracking-wider uppercase rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                PRO
              </span>
            ) : (
              <span className="px-1.5 py-0.2 text-[9px] font-medium tracking-wider uppercase rounded bg-slate-800 text-slate-400 border border-slate-700">
                FREE
              </span>
            )}
          </div>
        </div>

        {/* Global Command Palette Trigger */}
        {onOpenCommandPalette && (
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 px-2 sm:px-2.5 py-1.5 rounded-lg bg-studio-950/80 hover:bg-studio-950 border border-studio-border text-xs text-slate-400 hover:text-slate-200 transition-colors shadow-inner"
            title="Search tools, actions, and servers (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="hidden xl:inline text-slate-400 text-xs">Search actions...</span>
            <kbd className="text-[10px] font-mono px-1 py-0.2 rounded bg-studio-900 border border-studio-border text-slate-500">
              Ctrl+K
            </kbd>
          </button>
        )}
      </div>

      {/* 2. Center: Pure Core Workspace Tabs */}
      <nav className="flex items-center gap-0.5 bg-studio-950/60 p-1 rounded-xl border border-studio-border text-xs font-medium max-w-fit overflow-x-auto mx-1 sm:mx-2">
        <button
          onClick={() => setActiveTab('tools')}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'tools'
              ? 'bg-studio-800 text-white shadow-sm shadow-black/40 text-indigo-300 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-studio-900'
          }`}
          title="Tool Inspector & Execution"
        >
          <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="hidden lg:inline">Tools</span>
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'simulator'
              ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-studio-900 border border-transparent'
          }`}
          title="AI Agent Simulator (Ollama & Cloud)"
        >
          <Cpu className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span className="hidden lg:inline">Simulator</span>
        </button>

        <button
          onClick={() => setActiveTab('resources')}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'resources'
              ? 'bg-studio-800 text-white shadow-sm shadow-black/40 text-indigo-300 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-studio-900'
          }`}
          title="Resource Viewer (mcp:// URI Explorer)"
        >
          <FileCode2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="hidden lg:inline">Resources</span>
        </button>

        <button
          onClick={() => setActiveTab('prompts')}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'prompts'
              ? 'bg-studio-800 text-white shadow-sm shadow-black/40 text-indigo-300 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-studio-900'
          }`}
          title="Prompt Template Tester"
        >
          <MessageSquare className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="hidden lg:inline">Prompts</span>
        </button>

        <button
          onClick={() => setActiveTab('traffic')}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'traffic'
              ? 'bg-studio-800 text-white shadow-sm shadow-black/40 text-cyan-300 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-studio-900'
          }`}
          title="Live JSON-RPC Traffic Inspector"
        >
          <Activity className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="hidden lg:inline">Traffic</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'analytics'
              ? 'bg-studio-800 text-white shadow-sm shadow-black/40 text-indigo-300 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-studio-900'
          }`}
          title="Protocol Telemetry & Metrics"
        >
          <BarChart3 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="hidden lg:inline">Analytics</span>
        </button>
      </nav>

      {/* 3. Right: Clean Unified Action Deck (Just 4 Anchors) */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {/* Anchor 1: 🧰 Developer Toolkit Hub */}
        {onOpenToolkit && (
          <button
            onClick={onOpenToolkit}
            className="toolkit-btn flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-sm"
            title="Open Developer Power Toolkit (15 Specialized Tools)"
          >
            <Wrench className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="hidden sm:inline">Toolkit</span>
          </button>
        )}

        {/* Anchor 2: 🌐 Environment Profile Button */}
        <button
          onClick={onOpenEnvironmentsModal}
          className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-medium text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/50 transition-colors"
          title="Environment Profile & Variables"
        >
          <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="font-mono text-[11px] max-w-[65px] truncate hidden sm:inline">
            {activeEnvironment?.name || 'Dev'}
          </span>
        </button>

        {/* Anchor 3: 🔔 Notification Center */}
        {onOpenNotifications && (
          <button
            onClick={onOpenNotifications}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-studio-850 hover:bg-studio-800 border border-studio-border transition-colors relative"
            title="Notification Center & System Events"
          >
            <Bell className="w-3.5 h-3.5 text-indigo-400" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse shadow-sm shadow-rose-500/50" />
            )}
          </button>
        )}

        {/* Anchor 4: ⚙️ Unified Preferences & Studio Options Popover */}
        <div className="relative" ref={popoverRef}>
          <button
            onClick={() => setIsPreferencesOpen(!isPreferencesOpen)}
            className={`p-1.5 rounded-xl border transition-all ${
              isPreferencesOpen
                ? 'bg-studio-800 border-indigo-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white bg-studio-850 hover:bg-studio-800 border-studio-border'
            }`}
            title="Preferences & Studio Options"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          {isPreferencesOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-studio-900 border border-studio-border rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2.5 py-1">
                Studio Preferences
              </div>

              {/* Theme Studio */}
              {onOpenThemeModal && (
                <button
                  onClick={() => {
                    setIsPreferencesOpen(false)
                    onOpenThemeModal()
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-studio-800 text-xs text-slate-200 hover:text-white flex items-center justify-between transition-colors font-medium"
                >
                  <div className="flex items-center gap-2">
                    <Palette className="w-3.5 h-3.5 text-purple-400" />
                    <span>Theme Studio</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Dark & Light</span>
                </button>
              )}

              {/* Sound FX Toggle directly inside popover */}
              <button
                onClick={toggleSound}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-studio-800 text-xs text-slate-200 hover:text-white flex items-center justify-between transition-colors font-medium"
              >
                <div className="flex items-center gap-2">
                  {soundOn ? (
                    <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  )}
                  <span>Sound Effects (Audio FX)</span>
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                    soundOn
                      ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'bg-studio-800 text-slate-500 border border-studio-border'
                  }`}
                >
                  {soundOn ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* Keyboard Shortcuts */}
              {onOpenShortcutsModal && (
                <button
                  onClick={() => {
                    setIsPreferencesOpen(false)
                    onOpenShortcutsModal()
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-studio-800 text-xs text-slate-200 hover:text-white flex items-center justify-between transition-colors font-medium"
                >
                  <div className="flex items-center gap-2">
                    <Keyboard className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Keyboard Cheatsheet</span>
                  </div>
                  <kbd className="text-[10px] font-mono px-1 py-0.2 rounded bg-studio-950 border border-studio-border text-slate-400">
                    ?
                  </kbd>
                </button>
              )}

              {/* Saved Collections */}
              {onOpenCollectionsDrawer && (
                <button
                  onClick={() => {
                    setIsPreferencesOpen(false)
                    onOpenCollectionsDrawer()
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-studio-800 text-xs text-slate-200 hover:text-white flex items-center gap-2 transition-colors font-medium"
                >
                  <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Saved Request Collections</span>
                </button>
              )}

              {/* Settings & About Section */}
              <div className="my-1 border-t border-studio-border" />
              {onOpenOnboarding && (
                <button
                  onClick={() => {
                    setIsPreferencesOpen(false)
                    onOpenOnboarding()
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-studio-800 text-xs text-slate-200 hover:text-white flex items-center gap-2 transition-colors font-medium"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Welcome Tour &amp; Quickstart</span>
                </button>
              )}
              {onOpenSettingsModal && (
                <>
                  <button
                    onClick={() => {
                      setIsPreferencesOpen(false)
                      onOpenSettingsModal('about')
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-studio-800 text-xs text-slate-200 hover:text-white flex items-center justify-between transition-colors font-medium"
                  >
                    <div className="flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 text-indigo-400" />
                      <span>About MCP Studio</span>
                    </div>
                    <span className="text-[10px] text-indigo-300 font-mono font-bold bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.2 rounded">
                      v{appVersion}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setIsPreferencesOpen(false)
                      onOpenSettingsModal('about')
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-studio-800 text-xs text-slate-200 hover:text-white flex items-center justify-between transition-colors font-medium"
                  >
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Check for Updates...</span>
                    </div>
                    <span className="text-[10px] text-cyan-400 font-mono font-bold">v{appVersion}</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsPreferencesOpen(false)
                      onOpenSettingsModal('vault')
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-studio-800 text-xs text-slate-200 hover:text-white flex items-center gap-2 transition-colors font-medium"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>Settings &amp; API Key Vault</span>
                  </button>
                </>
              )}

              {/* License Management */}
              {onOpenLicenseModal && (
                <>
                  <div className="my-1 border-t border-studio-border" />
                  <button
                    onClick={() => {
                      setIsPreferencesOpen(false)
                      onOpenLicenseModal()
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-studio-800 text-xs text-indigo-600 dark:text-indigo-300 font-bold flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>{license.isPro ? 'Pro License Active' : 'Upgrade to Pro'}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 rounded">
                      {license.tier.toUpperCase()}
                    </span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
})

Header.displayName = 'Header'
