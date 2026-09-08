import React, { useMemo } from 'react'
import {
  X,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2
} from 'lucide-react'
import { McpTool, SchemaLintResult, SchemaLintIssue } from '../../../shared/types'

interface SchemaLinterModalProps {
  isOpen: boolean
  onClose: () => void
  tool?: McpTool
}

export const SchemaLinterModal: React.FC<SchemaLinterModalProps> = ({
  isOpen,
  onClose,
  tool
}) => {
  // Analyze schema
  const lintResult: SchemaLintResult = useMemo(() => {
    if (!tool) {
      return {
        toolName: '',
        score: 0,
        tokenEstimate: 0,
        issues: []
      }
    }
    const issues: SchemaLintIssue[] = []
    let score = 100

    // 1. Tool Description Check
    if (!tool.description || tool.description.trim().length === 0) {
      issues.push({
        severity: 'error',
        path: 'description',
        message: 'Tool description is completely missing.',
        suggestion: 'Add a clear 1-2 sentence description explaining what this tool does and when the LLM should invoke it.'
      })
      score -= 30
    } else if (tool.description.trim().length < 20) {
      issues.push({
        severity: 'warning',
        path: 'description',
        message: 'Tool description is very short (< 20 characters).',
        suggestion: 'Elaborate on input requirements and output format to help LLM agents select this tool accurately.'
      })
      score -= 10
    }

    // 2. Properties check
    const props = tool.inputSchema?.properties || {}
    const propKeys = Object.keys(props)

    if (propKeys.length === 0 && tool.inputSchema?.type === 'object') {
      issues.push({
        severity: 'info',
        path: 'inputSchema.properties',
        message: 'Tool accepts no properties (empty object).'
      })
    }

    for (const key of propKeys) {
      const p = props[key]
      if (!p?.description || p.description.trim().length === 0) {
        issues.push({
          severity: 'warning',
          path: `properties.${key}.description`,
          message: `Parameter "${key}" has no description.`,
          suggestion: `Add a description for "${key}" so LLMs provide correct data types and semantic values.`
        })
        score -= 10
      }

      if (!p?.type) {
        issues.push({
          severity: 'error',
          path: `properties.${key}.type`,
          message: `Parameter "${key}" has no explicit "type" defined.`,
          suggestion: 'Specify type: "string" | "number" | "boolean" | "array" | "object".'
        })
        score -= 15
      }
    }

    // 3. Required Array Check
    const requiredList = tool.inputSchema?.required || []
    for (const req of requiredList) {
      if (!props[req]) {
        issues.push({
          severity: 'error',
          path: 'inputSchema.required',
          message: `Required property "${req}" is not defined in properties schema.`,
          suggestion: `Define properties.${req} or remove it from the required list.`
        })
        score -= 20
      }
    }

    // Token estimation
    const schemaJson = JSON.stringify(tool.inputSchema || {})
    const tokenEstimate = Math.ceil(schemaJson.length / 3.8)

    return {
      toolName: tool.name,
      score: Math.max(0, score),
      tokenEstimate,
      issues
    }
  }, [tool])

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { label: 'A+ Excellent', color: 'text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/50' }
    if (score >= 75) return { label: 'B Good', color: 'text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 border-cyan-200 dark:border-cyan-800/50' }
    if (score >= 50) return { label: 'C Needs Work', color: 'text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/50' }
    return { label: 'F Poor Schema', color: 'text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/50' }
  }

  if (!isOpen || !tool) return null

  const badge = getScoreBadge(lintResult.score)

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-studio-900 border border-studio-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-studio-border bg-studio-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Schema Linter & LLM Readiness</span>
                <span className="font-mono text-cyan-400 text-xs px-2 py-0.5 rounded-lg bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/40 font-bold">
                  {tool.name}
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Verify that your tool definition conforms to Anthropic, OpenAI, and Ollama tool-calling standards.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Score & Metrics Banner */}
        <div className="p-5 border-b border-studio-border bg-studio-950/40 grid grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl border border-studio-border bg-studio-900/60 space-y-1 shadow-sm">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Schema Quality</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{lintResult.score}</span>
              <span className="text-xs text-slate-500">/ 100</span>
            </div>
            <div className={`text-[10px] font-bold px-2 py-0.5 rounded-md border inline-block ${badge.color}`}>
              {badge.label}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl border border-studio-border bg-studio-900/60 space-y-1 shadow-sm">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Context Footprint</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-300">~{lintResult.tokenEstimate}</span>
              <span className="text-xs text-slate-500">tokens</span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium">Per prompt inclusion</div>
          </div>

          <div className="p-3.5 rounded-2xl border border-studio-border bg-studio-900/60 space-y-1 shadow-sm">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Issues Detected</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{lintResult.issues.length}</span>
              <span className="text-xs text-slate-500">items</span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              {lintResult.issues.filter((i) => i.severity === 'error').length} Errors
            </div>
          </div>
        </div>

        {/* Issues List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-transparent">
          {lintResult.issues.length === 0 ? (
            <div className="h-48 border border-dashed border-emerald-300 dark:border-emerald-800/40 rounded-2xl flex flex-col items-center justify-center p-6 text-center space-y-2 bg-emerald-50/50 dark:bg-emerald-950/10 shadow-sm">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              <p className="text-sm font-bold text-white">Perfect Schema!</p>
              <p className="text-xs text-slate-400 max-w-sm font-medium">
                This tool schema includes all necessary descriptions, explicit types, and follows best practices for LLM agent integration.
              </p>
            </div>
          ) : (
            lintResult.issues.map((issue, idx) => {
              const isErr = issue.severity === 'error'
              const isWarn = issue.severity === 'warning'

              return (
                <div
                  key={idx}
                  className={`border rounded-2xl p-4 transition-all shadow-sm ${
                    isErr
                      ? 'border-rose-800/40 bg-rose-50/70 dark:bg-rose-950/10'
                      : isWarn
                        ? 'border-amber-800/40 bg-amber-50/70 dark:bg-amber-950/10'
                        : 'border-studio-border bg-studio-950/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {isErr ? (
                      <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    ) : isWarn ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    )}

                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{issue.message}</span>
                        <code className="text-[10px] text-slate-500 font-mono font-semibold">{issue.path}</code>
                      </div>

                      {issue.suggestion && (
                        <p className="text-xs text-slate-400 leading-relaxed pt-1 font-medium">
                          <span className="text-indigo-400 font-bold">Tip: </span>
                          {issue.suggestion}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-studio-border bg-studio-950 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-studio-800 hover:bg-studio-700 text-slate-200 text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
