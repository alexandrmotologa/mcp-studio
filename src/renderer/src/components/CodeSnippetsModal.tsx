import React, { useState } from 'react'
import {
  X,
  Code2,
  Copy,
  Check,
  Download
} from 'lucide-react'
import { McpServerConfig, McpTool } from '../../../shared/types'
import { generateClientCode } from '../utils/codeSnippetGenerator'
import { downloadFile } from '../utils/fileDownloader'

interface CodeSnippetsModalProps {
  isOpen: boolean
  onClose: () => void
  tool?: McpTool
  server?: McpServerConfig
  currentArgs?: Record<string, any>
}

export const CodeSnippetsModal: React.FC<CodeSnippetsModalProps> = ({
  isOpen,
  onClose,
  tool,
  server,
  currentArgs = {}
}) => {
  const [lang, setLang] = useState<'python' | 'typescript' | 'curl' | 'go' | 'rust'>('python')
  const [copied, setCopied] = useState(false)

  if (!isOpen || !tool) return null

  const code = generateClientCode(lang, tool, server, currentArgs)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleDownload = () => {
    const ext = lang === 'python' ? 'py' : lang === 'typescript' ? 'ts' : lang === 'go' ? 'go' : lang === 'rust' ? 'rs' : 'sh'
    downloadFile(`client_${tool.name}.${ext}`, code, 'text/plain;charset=utf-8')
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-studio-900 border border-studio-border rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col h-[80vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-studio-border bg-studio-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-sm">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Client Code Generator:</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-300 font-bold">{tool.name}</span>
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                1-Click copy integration code in Python, TypeScript, cURL, Go, or Rust with current parameters.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar Tabs */}
        <div className="px-6 py-2.5 border-b border-studio-border bg-studio-950/40 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'python', name: 'Python (SDK)', icon: '🐍' },
              { id: 'typescript', name: 'TypeScript', icon: '🟦' },
              { id: 'curl', name: 'cURL / HTTP', icon: '🌐' },
              { id: 'go', name: 'Go (Golang)', icon: '🐹' },
              { id: 'rust', name: 'Rust', icon: '🦀' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setLang(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                  lang === tab.id
                    ? 'bg-indigo-50 dark:bg-indigo-600/20 border border-indigo-300 dark:border-indigo-500 text-indigo-900 dark:text-indigo-300'
                    : 'bg-transparent text-slate-400 hover:bg-studio-900 border border-slate-200 dark:border-transparent'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl bg-studio-850 hover:bg-studio-800 border border-studio-border text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Snippet!' : 'Copy Code'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-indigo-600/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>

        {/* Code Body */}
        <div className="flex-1 p-5 overflow-auto bg-studio-950">
          <pre className="text-xs font-mono text-slate-200 leading-relaxed font-medium">
            <code>{code}</code>
          </pre>
        </div>
      </div>
    </div>
  )
}
