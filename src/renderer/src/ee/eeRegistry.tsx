import React from 'react'

export const isEeAvailable = false

// Community Edition: Enterprise power modals are disabled
export const EeAiSimulator: React.FC<any> = () => null
export const EeLicenseModal: React.FC<any> = () => null
export const EeDeveloperToolkitModal: React.FC<any> = () => null
export const EeModelArenaModal: React.FC<any> = () => null
export const EeServerHubModal: React.FC<any> = () => null
export const EeTestSuiteModal: React.FC<any> = () => null
export const EeMockServerModal: React.FC<any> = () => null
export const EeDocsExporterModal: React.FC<any> = () => null
export const EeWorkspaceTransferModal: React.FC<any> = () => null
export const EeBenchmarkRunnerModal: React.FC<any> = () => null
export const EeSecurityAuditorModal: React.FC<any> = () => null
export const EeServerScaffolderModal: React.FC<any> = () => null
export const EeWorkflowBuilderModal: React.FC<any> = () => null
export const EeSchemaDiffModal: React.FC<any> = () => null
export const EeShortcutsModal: React.FC<any> = () => null
export const EeRemoteBridgeModal: React.FC<any> = () => null
export const EeThemeSelectorModal: React.FC<any> = () => null
export const EeOpenApiConverterModal: React.FC<any> = () => null
export const EeProcessWatchdogModal: React.FC<any> = () => null
export const EeDockerPackagerModal: React.FC<any> = () => null
export const EeSessionRecorderModal: React.FC<any> = () => null
export const EeTrafficInterceptorModal: React.FC<any> = () => null
export const EeNotificationCenterModal: React.FC<any> = () => null
export const EeAutoDiscoverModal: React.FC<any> = () => null
export const EeExportModal: React.FC<any> = () => null
export const EeAnalyticsDashboard: React.FC<any> = () => null

export type NotificationType = 'info' | 'success' | 'warning' | 'error'
export type NotificationCategory = 'system' | 'license' | 'updater' | 'servers' | 'processes' | 'settings'
export type NotificationActionType = 'restart-update' | 'open-settings' | 'open-license' | 'open-tools'

export interface StudioNotification {
  id: string
  title: string
  message: string
  type: NotificationType
  category?: NotificationCategory
  timestamp: number
  read?: boolean
  actionLabel?: string
  actionType?: NotificationActionType
}

export function CommunityUpsellCard({ featureName }: { featureName: string }): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-slate-700/50 rounded-2xl bg-slate-900/40">
      <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 text-xl font-bold">
        💎
      </div>
      <h3 className="text-lg font-semibold text-slate-200 mb-2">
        {featureName} is available in Pro
      </h3>
      <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
        This capability is part of MCP Studio Pro. Upgrade to unlock multi-LLM simulation, autonomous testing, and the 15-tool developer suite.
      </p>
      <a
        href="https://mcp.mtlglabs.space/pricing"
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-medium text-sm rounded-lg shadow-lg shadow-amber-500/10 transition-all"
      >
        Learn About MCP Studio Pro
      </a>
    </div>
  )
}
