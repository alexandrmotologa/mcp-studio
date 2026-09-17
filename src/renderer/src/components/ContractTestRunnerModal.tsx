import React, { useState } from 'react'
import {
  X,
  Play,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Download,
  Copy,
  Check,
  Sparkles,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react'
import {
  ContractTestSuite,
  ContractTestCase,
  ContractAssertion,
  ContractAssertionType,
  ContractTestReport,
  McpServerConfig,
  McpTool
} from '../../../shared/types'
import {
  runContractTestSuite,
  generateMarkdownReport
} from '../utils/contractTesterEngine'

interface ContractTestRunnerModalProps {
  isOpen: boolean
  onClose: () => void
  servers: McpServerConfig[]
  serverMetadataMap: Record<
    string,
    { tools: McpTool[]; resources: any[]; prompts: any[] }
  >
  activeServerId?: string | null
}

export const ContractTestRunnerModal: React.FC<ContractTestRunnerModalProps> = ({
  isOpen,
  onClose,
  servers,
  serverMetadataMap,
  activeServerId
}) => {
  const [selectedServerId, setSelectedServerId] = useState<string>(
    activeServerId || servers[0]?.id || ''
  )
  const [activeTab, setActiveTab] = useState<'editor' | 'execution'>('editor')

  const currentServer = servers.find((s) => s.id === selectedServerId) || servers[0]
  const currentTools = serverMetadataMap[currentServer?.id || '']?.tools || []

  // Initialize a default suite for current server
  const [suite, setSuite] = useState<ContractTestSuite>(() => {
    const sId = currentServer?.id || 'default'
    const sName = currentServer?.name || 'MCP Server'
    const firstTool = currentTools[0]?.name || 'ping'

    return {
      id: 'suite_' + Date.now(),
      serverId: sId,
      serverName: sName,
      name: `${sName} Contract Suite`,
      description: 'Automated contract verification and latency threshold checks',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      testCases: [
        {
          id: 'tc_' + Date.now(),
          name: `${firstTool} Schema & Status Check`,
          toolName: firstTool,
          arguments: {},
          enabled: true,
          assertions: [
            { id: 'a1', type: 'status_success' },
            { id: 'a2', type: 'duration_lt', toleranceMs: 500 },
            { id: 'a3', type: 'schema_valid' }
          ]
        }
      ]
    }
  })

  // Selected test case in editor
  const [selectedCaseId, setSelectedCaseId] = useState<string>(suite.testCases[0]?.id || '')
  const selectedCase = suite.testCases.find((c) => c.id === selectedCaseId) || suite.testCases[0]

  // Execution state
  const [isRunning, setIsRunning] = useState(false)
  const [report, setReport] = useState<ContractTestReport | null>(null)
  const [copied, setCopied] = useState(false)
  const [expandedCaseIds, setExpandedCaseIds] = useState<Set<string>>(new Set())

  // Switch server helper
  const handleServerChange = (newServerId: string) => {
    setSelectedServerId(newServerId)
    const targetServer = servers.find((s) => s.id === newServerId)
    if (targetServer) {
      const targetTools = serverMetadataMap[targetServer.id]?.tools || []
      const firstTool = targetTools[0]?.name || 'default_tool'
      const newSuite: ContractTestSuite = {
        id: 'suite_' + Date.now(),
        serverId: targetServer.id,
        serverName: targetServer.name,
        name: `${targetServer.name} Contract Suite`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        testCases: [
          {
            id: 'tc_' + Date.now(),
            name: `${firstTool} Contract Check`,
            toolName: firstTool,
            arguments: {},
            enabled: true,
            assertions: [
              { id: 'a1', type: 'status_success' },
              { id: 'a2', type: 'duration_lt', toleranceMs: 500 }
            ]
          }
        ]
      }
      setSuite(newSuite)
      if (newSuite.testCases[0]) {
        setSelectedCaseId(newSuite.testCases[0].id)
      }
      setReport(null)
    }
  }

  // Suite Editor actions
  const handleAddTestCase = () => {
    const firstTool = currentTools[0]?.name || 'test_tool'
    const newCase: ContractTestCase = {
      id: 'tc_' + Date.now(),
      name: `Contract Test ${suite.testCases.length + 1}`,
      toolName: firstTool,
      arguments: {},
      enabled: true,
      assertions: [{ id: 'a_' + Date.now(), type: 'status_success' }]
    }
    setSuite((prev) => ({
      ...prev,
      updatedAt: Date.now(),
      testCases: [...prev.testCases, newCase]
    }))
    setSelectedCaseId(newCase.id)
  }

  const handleDeleteTestCase = (id: string) => {
    if (suite.testCases.length <= 1) return
    setSuite((prev) => {
      const filtered = prev.testCases.filter((c) => c.id !== id)
      if (selectedCaseId === id) {
        setSelectedCaseId(filtered[0]?.id || '')
      }
      return { ...prev, testCases: filtered, updatedAt: Date.now() }
    })
  }

  const handleUpdateTestCase = (updates: Partial<ContractTestCase>) => {
    if (!selectedCase) return
    setSuite((prev) => ({
      ...prev,
      updatedAt: Date.now(),
      testCases: prev.testCases.map((c) => (c.id === selectedCase.id ? { ...c, ...updates } : c))
    }))
  }

  const handleAddAssertion = (type: ContractAssertionType) => {
    if (!selectedCase) return
    const newAssertion: ContractAssertion = {
      id: 'a_' + Date.now(),
      type,
      toleranceMs: type === 'duration_lt' ? 500 : undefined
    }
    handleUpdateTestCase({
      assertions: [...selectedCase.assertions, newAssertion]
    })
  }

  const handleRemoveAssertion = (assertionId: string) => {
    if (!selectedCase) return
    handleUpdateTestCase({
      assertions: selectedCase.assertions.filter((a) => a.id !== assertionId)
    })
  }

  const handleUpdateAssertion = (assertionId: string, updates: Partial<ContractAssertion>) => {
    if (!selectedCase) return
    handleUpdateTestCase({
      assertions: selectedCase.assertions.map((a) =>
        a.id === assertionId ? { ...a, ...updates } : a
      )
    })
  }

  // Generate mock arguments from tool schema
  const handleGenerateMockData = () => {
    if (!selectedCase) return
    const toolDef = currentTools.find((t) => t.name === selectedCase.toolName)
    if (!toolDef || !toolDef.inputSchema?.properties) {
      handleUpdateTestCase({ arguments: {} })
      return
    }

    const mock: Record<string, any> = {}
    for (const [key, prop] of Object.entries(toolDef.inputSchema.properties)) {
      if (prop.default !== undefined) {
        mock[key] = prop.default
      } else if (prop.enum && prop.enum.length > 0) {
        mock[key] = prop.enum[0]
      } else if (prop.type === 'string') {
        mock[key] = `sample_${key}`
      } else if (prop.type === 'number' || prop.type === 'integer') {
        mock[key] = 10
      } else if (prop.type === 'boolean') {
        mock[key] = true
      } else if (prop.type === 'array') {
        mock[key] = []
      } else if (prop.type === 'object') {
        mock[key] = {}
      } else {
        mock[key] = 'test'
      }
    }
    handleUpdateTestCase({ arguments: mock })
  }

  // Execute suite
  const handleRunSuite = async () => {
    if (!currentServer) return
    setIsRunning(true)
    setActiveTab('execution')

    const executor = async (toolName: string, args: Record<string, any>) => {
      return await window.api.mcp.callTool(
        currentServer.id,
        currentServer.name,
        toolName,
        args
      )
    }

    try {
      const generatedReport = await runContractTestSuite(suite, executor)
      setReport(generatedReport)
    } finally {
      setIsRunning(false)
    }
  }

  // Copy / Download Reports
  const handleCopyMarkdown = () => {
    if (!report) return
    const md = generateMarkdownReport(report)
    navigator.clipboard.writeText(md)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadReport = (format: 'md' | 'json') => {
    if (!report) return
    const filename = `mcp_contract_report_${suite.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}_${Date.now()}.${format}`
    const content = format === 'md' ? generateMarkdownReport(report) : JSON.stringify(report, null, 2)
    const blob = new Blob([content], { type: format === 'md' ? 'text/markdown' : 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const toggleExpandCase = (id: string) => {
    setExpandedCaseIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (!isOpen) return null

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-studio-900 border border-studio-border rounded-2xl w-full max-w-5xl h-[88vh] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95"
      >
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-studio-border bg-studio-950/90 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">Contract &amp; Regression Test Runner</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Assertions Suite
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Assert tool schemas, output contracts, and latency thresholds with reproducible test reports
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Target Server Selector */}
            <select
              value={selectedServerId}
              onChange={(e) => handleServerChange(e.target.value)}
              className="bg-studio-950 border border-studio-border text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-500 font-medium"
            >
              {servers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.transport})
                </option>
              ))}
            </select>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-studio-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Toggle Navigation */}
        <div className="px-6 py-2 border-b border-studio-border bg-studio-950/40 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'editor'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-studio-850'
              }`}
            >
              Suite Editor ({suite.testCases.length})
            </button>
            <button
              onClick={() => setActiveTab('execution')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'execution'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-studio-850'
              }`}
            >
              Test Execution &amp; Report {report && `(${report.passedCount}/${report.totalTests} passed)`}
            </button>
          </div>

          <button
            onClick={handleRunSuite}
            disabled={isRunning || suite.testCases.length === 0}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 transition-all shadow-md shadow-purple-600/20 cursor-pointer"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Executing Tests...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Test Suite</span>
              </>
            )}
          </button>
        </div>

        {/* Tab 1: Suite Editor */}
        {activeTab === 'editor' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left Case List */}
            <div className="w-72 border-r border-studio-border bg-studio-950/50 flex flex-col h-full flex-shrink-0">
              <div className="p-3 border-b border-studio-border flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Test Cases ({suite.testCases.length})
                </span>
                <button
                  onClick={handleAddTestCase}
                  className="p-1 rounded-md text-purple-400 hover:bg-studio-800 transition-colors"
                  title="Add Test Case"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {suite.testCases.map((tc, index) => {
                  const isSelected = tc.id === selectedCase?.id
                  return (
                    <div
                      key={tc.id}
                      onClick={() => setSelectedCaseId(tc.id)}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-purple-500/15 border-purple-500/50 text-white shadow-sm'
                          : 'bg-transparent border-transparent hover:bg-studio-850 text-slate-300'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-mono text-purple-400 font-bold">
                            #{index + 1}
                          </span>
                          <span className="text-xs font-bold truncate">{tc.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono truncate">
                          {tc.toolName} ({tc.assertions.length} rules)
                        </div>
                      </div>

                      {suite.testCases.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteTestCase(tc.id)
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors ml-1"
                          title="Delete test case"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Right Case Detail & Assertions Editor */}
            <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 space-y-5 bg-studio-900/40">
              {selectedCase ? (
                <>
                  {/* Case Parameters */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Test Case Name
                      </label>
                      <input
                        type="text"
                        value={selectedCase.name}
                        onChange={(e) => handleUpdateTestCase({ name: e.target.value })}
                        className="w-full bg-studio-950 border border-studio-border rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Target Tool
                      </label>
                      <select
                        value={selectedCase.toolName}
                        onChange={(e) => handleUpdateTestCase({ toolName: e.target.value })}
                        className="w-full bg-studio-950 border border-studio-border rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-medium"
                      >
                        {currentTools.map((t) => (
                          <option key={t.name} value={t.name}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Arguments Editor */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300">
                        Tool Arguments (JSON)
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateMockData}
                        className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 font-medium"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Prefill from Schema</span>
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={JSON.stringify(selectedCase.arguments, null, 2)}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value)
                          handleUpdateTestCase({ arguments: parsed })
                        } catch {
                          // Allow editing raw text
                        }
                      }}
                      className="w-full bg-studio-950 border border-studio-border rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* Assertion Rules List */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                        Contract Assertions ({selectedCase.assertions.length})
                      </label>

                      {/* Add Assertion Menu */}
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-slate-500 mr-1">Add Rule:</span>
                        {(['status_success', 'duration_lt', 'schema_valid', 'json_path_equals', 'contains_text', 'regex_match'] as ContractAssertionType[]).map(
                          (ruleType) => (
                            <button
                              key={ruleType}
                              onClick={() => handleAddAssertion(ruleType)}
                              className="px-2 py-0.5 rounded bg-studio-950 border border-studio-border hover:border-purple-500 text-[10px] text-slate-300 hover:text-white transition-colors"
                            >
                              +{ruleType.replace('_', ' ')}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {selectedCase.assertions.map((assertion, aIdx) => (
                        <div
                          key={assertion.id}
                          className="p-3 rounded-xl bg-studio-950 border border-studio-border flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-purple-400 font-bold text-[11px]">
                              #{aIdx + 1}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 font-mono text-[11px] border border-purple-500/20 font-bold">
                              {assertion.type}
                            </span>
                          </div>

                          <div className="flex-1 flex items-center gap-3">
                            {assertion.type === 'duration_lt' && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400 text-[11px]">Tolerance (ms):</span>
                                <input
                                  type="number"
                                  value={assertion.toleranceMs ?? 500}
                                  onChange={(e) =>
                                    handleUpdateAssertion(assertion.id, {
                                      toleranceMs: parseInt(e.target.value, 10) || 0
                                    })
                                  }
                                  className="w-24 bg-studio-900 border border-studio-border rounded px-2 py-0.5 text-xs text-slate-200 font-mono"
                                />
                              </div>
                            )}

                            {assertion.type === 'json_path_equals' && (
                              <>
                                <input
                                  type="text"
                                  placeholder="path (e.g. content[0].text)"
                                  value={assertion.path || ''}
                                  onChange={(e) =>
                                    handleUpdateAssertion(assertion.id, { path: e.target.value })
                                  }
                                  className="flex-1 bg-studio-900 border border-studio-border rounded px-2 py-0.5 text-xs text-slate-200 font-mono"
                                />
                                <input
                                  type="text"
                                  placeholder="expected value"
                                  value={assertion.expectedValue || ''}
                                  onChange={(e) =>
                                    handleUpdateAssertion(assertion.id, { expectedValue: e.target.value })
                                  }
                                  className="flex-1 bg-studio-900 border border-studio-border rounded px-2 py-0.5 text-xs text-slate-200 font-mono"
                                />
                              </>
                            )}

                            {(assertion.type === 'contains_text' || assertion.type === 'regex_match') && (
                              <input
                                type="text"
                                placeholder={assertion.type === 'regex_match' ? 'RegExp pattern' : 'Substring to match'}
                                value={assertion.expectedValue || ''}
                                onChange={(e) =>
                                  handleUpdateAssertion(assertion.id, { expectedValue: e.target.value })
                                }
                                className="flex-1 bg-studio-900 border border-studio-border rounded px-2 py-0.5 text-xs text-slate-200 font-mono"
                              />
                            )}

                            {assertion.type === 'status_success' && (
                              <span className="text-[11px] text-slate-400">
                                Verifies isError is false and no JSON-RPC fault code is returned
                              </span>
                            )}

                            {assertion.type === 'schema_valid' && (
                              <span className="text-[11px] text-slate-400">
                                Verifies output structure conforms to MCP tool response specs
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => handleRemoveAssertion(assertion.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                            title="Remove assertion rule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  Select or add a test case to configure.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Test Execution & Report */}
        {activeTab === 'execution' && (
          <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-5 bg-studio-900/40">
            {report ? (
              <>
                {/* Summary Scorecard */}
                <div className="grid grid-cols-4 gap-4 flex-shrink-0">
                  <div className="p-3.5 rounded-xl bg-studio-950 border border-studio-border">
                    <div className="text-[11px] text-slate-400 font-bold uppercase mb-1">Total Tests</div>
                    <div className="text-2xl font-extrabold text-white font-mono">{report.totalTests}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-studio-950 border border-emerald-500/30">
                    <div className="text-[11px] text-emerald-400 font-bold uppercase mb-1">Passed</div>
                    <div className="text-2xl font-extrabold text-emerald-400 font-mono">{report.passedCount}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-studio-950 border border-rose-500/30">
                    <div className="text-[11px] text-rose-400 font-bold uppercase mb-1">Failed</div>
                    <div className="text-2xl font-extrabold text-rose-400 font-mono">{report.failedCount}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-studio-950 border border-studio-border">
                    <div className="text-[11px] text-slate-400 font-bold uppercase mb-1">Avg Latency</div>
                    <div className="text-2xl font-extrabold text-purple-300 font-mono">{report.avgDurationMs}ms</div>
                  </div>
                </div>

                {/* Results List */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {report.results.map((res) => {
                    const isExpanded = expandedCaseIds.has(res.testCaseId)
                    const isPassed = res.status === 'passed'

                    return (
                      <div
                        key={res.testCaseId}
                        className={`rounded-xl border overflow-hidden transition-all ${
                          isPassed
                            ? 'bg-studio-950/80 border-emerald-500/20'
                            : 'bg-studio-950/80 border-rose-500/30'
                        }`}
                      >
                        <div
                          onClick={() => toggleExpandCase(res.testCaseId)}
                          className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-studio-900/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {isPassed ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                            ) : (
                              <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white">{res.testCaseName}</span>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-studio-900 text-slate-400">
                                  {res.toolName}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                Latency: {res.durationMs}ms | {res.assertionResults.filter((a) => a.passed).length}/
                                {res.assertionResults.length} assertions passed
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="p-4 border-t border-studio-border/60 bg-studio-900/30 space-y-3">
                            {res.error && (
                              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
                                Error: {res.error}
                              </div>
                            )}

                            <div className="space-y-1.5">
                              <div className="text-[11px] font-bold text-slate-400 uppercase">
                                Assertion Breakdown:
                              </div>
                              {res.assertionResults.map((ar, aIdx) => (
                                <div
                                  key={aIdx}
                                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-studio-950 border border-studio-border"
                                >
                                  <div className="flex items-center gap-2">
                                    {ar.passed ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <X className="w-3.5 h-3.5 text-rose-400" />
                                    )}
                                    <span className="font-mono text-purple-300 font-bold">
                                      {ar.assertion.type}
                                    </span>
                                    <span className="text-slate-300">{ar.message}</span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {res.rawResponse && (
                              <div className="space-y-1">
                                <div className="text-[10px] font-bold text-slate-500 uppercase">
                                  Raw Response:
                                </div>
                                <pre className="p-3 rounded-lg bg-studio-950 border border-studio-border font-mono text-[11px] text-slate-300 max-h-40 overflow-auto">
                                  {JSON.stringify(res.rawResponse, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Report Actions Bar */}
                <div className="pt-3 border-t border-studio-border flex items-center justify-between flex-shrink-0">
                  <div className="text-xs text-slate-400 font-medium">
                    Report ready for export or pipeline integration
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyMarkdown}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-studio-850 hover:bg-studio-800 border border-studio-border text-xs text-slate-200 transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied Markdown' : 'Copy Markdown'}</span>
                    </button>

                    <button
                      onClick={() => handleDownloadReport('md')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-studio-850 hover:bg-studio-800 border border-studio-border text-xs text-slate-200 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .md</span>
                    </button>

                    <button
                      onClick={() => handleDownloadReport('json')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-colors shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .json</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500">
                <ShieldCheck className="w-10 h-10 mb-3 text-purple-400/40" />
                <p className="text-sm font-medium text-slate-300">No test execution report available yet.</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Click &quot;Run Test Suite&quot; above to execute contract assertions against the active MCP server.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
