import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Copy, Check, Terminal } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallbackTitle?: string
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  copied: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false
  }

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary caught error]:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null, copied: false })
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  private handleCopyDetails = (): void => {
    const diagnostic = `MCP Studio Error Diagnostic:\n` +
      `Time: ${new Date().toISOString()}\n` +
      `Message: ${this.state.error?.message}\n` +
      `Stack: ${this.state.error?.stack}\n` +
      `Component Stack: ${this.state.errorInfo?.componentStack}`

    navigator.clipboard.writeText(diagnostic).then(() => {
      this.setState({ copied: true })
      setTimeout(() => this.setState({ copied: false }), 2000)
    })
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[300px] flex items-center justify-center p-6 bg-studio-950/90 select-text">
          <div className="max-w-xl w-full bg-studio-900 border border-rose-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {this.props.fallbackTitle || 'Component Render Interrupted'}
                </h3>
                <p className="text-xs text-slate-400">
                  An unexpected runtime error occurred in this view. Your session data is intact.
                </p>
              </div>
            </div>

            <div className="bg-studio-950 rounded-xl p-3.5 border border-studio-border text-xs font-mono text-rose-300 overflow-x-auto max-h-48">
              <div className="font-bold mb-1 flex items-center gap-1.5 text-slate-400">
                <Terminal className="w-3.5 h-3.5" />
                <span>Diagnostic Message:</span>
              </div>
              <p className="whitespace-pre-wrap">{this.state.error?.message || 'Unknown error'}</p>
              {this.state.error?.stack && (
                <details className="mt-2 text-[11px] text-slate-500 cursor-pointer">
                  <summary className="hover:text-slate-300 transition-colors">View Stack Trace</summary>
                  <pre className="mt-1 text-slate-400 select-all overflow-x-auto">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={this.handleCopyDetails}
                className="px-3 py-1.5 rounded-xl bg-studio-800 hover:bg-studio-750 border border-studio-border text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors shadow-sm"
              >
                {this.state.copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied Details!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Diagnostics</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-3 py-1.5 rounded-xl bg-studio-800 hover:bg-studio-750 border border-studio-border text-xs font-medium text-slate-300 hover:text-white transition-colors shadow-sm"
                >
                  Reload App
                </button>
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
