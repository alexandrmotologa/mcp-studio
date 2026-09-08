import React, { useState, useMemo } from 'react'
import {
  Code2,
  Table as TableIcon,
  FileText,
  Image as ImageIcon,
  Copy,
  Check,
  Search,
  ChevronRight,
  ChevronDown,
  ArrowUpDown
} from 'lucide-react'

interface ResponseVisualizerProps {
  data: any
  durationMs?: number
  isError?: boolean
}

type ViewMode = 'tree' | 'raw' | 'table' | 'markdown' | 'media'

export const ResponseVisualizer: React.FC<ResponseVisualizerProps> = ({
  data,
  durationMs,
  isError
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('tree')
  const [copied, setCopied] = useState(false)
  const [tableSearch, setTableSearch] = useState('')
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Detect data characteristics
  const analysis = useMemo(() => {
    let arrayData: any[] | null = null
    let markdownString: string | null = null
    let base64Image: string | null = null

    // Check for array at root or in common payload properties
    if (Array.isArray(data)) {
      if (data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
        arrayData = data
      }
    } else if (data && typeof data === 'object') {
      for (const key of ['rows', 'items', 'data', 'results', 'records', 'tools', 'resources', 'prompts']) {
        if (Array.isArray(data[key]) && data[key].length > 0 && typeof data[key][0] === 'object') {
          arrayData = data[key]
          break
        }
      }

      // Check for content text (Markdown)
      if (Array.isArray(data.content)) {
        for (const item of data.content) {
          if (item.type === 'text' && typeof item.text === 'string') {
            markdownString = (markdownString ? markdownString + '\n\n' : '') + item.text
          } else if (item.type === 'image' && item.data) {
            base64Image = `data:${item.mimeType || 'image/png'};base64,${item.data}`
          }
        }
      }
    }

    // Check if raw string is markdown or base64
    if (typeof data === 'string') {
      if (data.startsWith('data:image/') || data.startsWith('iVBORw0KGgo')) {
        base64Image = data.startsWith('data:') ? data : `data:image/png;base64,${data}`
      } else if (data.includes('#') || data.includes('```') || data.includes('**')) {
        markdownString = data
      }
    }

    return {
      hasTable: !!arrayData,
      arrayData,
      hasMarkdown: !!markdownString,
      markdownString,
      hasMedia: !!base64Image,
      base64Image
    }
  }, [data])

  const handleCopy = () => {
    navigator.clipboard.writeText(typeof data === 'string' ? data : JSON.stringify(data, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Filtered & Sorted Table Data
  const tableRows = useMemo(() => {
    if (!analysis.arrayData) return []
    let rows = [...analysis.arrayData]

    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase()
      rows = rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q))
    }

    if (sortColumn) {
      rows.sort((a, b) => {
        const valA = a[sortColumn]
        const valB = b[sortColumn]
        if (valA === valB) return 0
        if (valA === undefined || valA === null) return 1
        if (valB === undefined || valB === null) return -1
        const comp = String(valA).localeCompare(String(valB), undefined, { numeric: true })
        return sortDirection === 'asc' ? comp : -comp
      })
    }

    return rows
  }, [analysis.arrayData, tableSearch, sortColumn, sortDirection])

  const tableColumns = useMemo(() => {
    if (!analysis.arrayData || analysis.arrayData.length === 0) return []
    const cols = new Set<string>()
    for (const item of analysis.arrayData.slice(0, 20)) {
      if (item && typeof item === 'object') {
        Object.keys(item).forEach((k) => cols.add(k))
      }
    }
    return Array.from(cols)
  }, [analysis.arrayData])

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(col)
      setSortDirection('asc')
    }
  }

  return (
    <div className="flex flex-col h-full bg-studio-950 rounded-xl border border-studio-border overflow-hidden">
      {/* Top Visualizer Toolbar */}
      <div className="px-4 py-2.5 border-b border-studio-border bg-studio-950/80 flex items-center justify-between gap-3">
        {/* View Mode Tabs */}
        <div className="flex items-center gap-1 bg-studio-900 p-0.5 rounded-lg border border-studio-border text-xs">
          <button
            onClick={() => setViewMode('tree')}
            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
              viewMode === 'tree'
                ? 'bg-indigo-600 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Tree</span>
          </button>

          <button
            onClick={() => setViewMode('raw')}
            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
              viewMode === 'raw'
                ? 'bg-indigo-600 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Raw JSON</span>
          </button>

          {analysis.hasTable && (
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'text-cyan-400 hover:text-cyan-300 font-semibold'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table ({analysis.arrayData?.length})</span>
            </button>
          )}

          {analysis.hasMarkdown && (
            <button
              onClick={() => setViewMode('markdown')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                viewMode === 'markdown'
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'text-purple-400 hover:text-purple-300 font-semibold'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Markdown</span>
            </button>
          )}

          {analysis.hasMedia && (
            <button
              onClick={() => setViewMode('media')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                viewMode === 'media'
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'text-emerald-400 hover:text-emerald-300 font-semibold'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Media</span>
            </button>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {viewMode === 'table' && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Filter table rows..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="bg-studio-900 border border-studio-border rounded-lg pl-7 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44"
              />
            </div>
          )}

          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-studio-900 border border-studio-border text-slate-400 hover:text-white transition-colors"
            title="Copy Response"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-4 text-xs font-mono">
        {/* 1. Tree View */}
        {viewMode === 'tree' && <JsonTreeNode data={data} name="root" isRoot={true} />}

        {/* 2. Raw JSON View */}
        {viewMode === 'raw' && (
          <pre className="text-slate-200 leading-relaxed overflow-x-auto select-text whitespace-pre-wrap">
            {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
          </pre>
        )}

        {/* 3. Table View */}
        {viewMode === 'table' && (
          <div className="overflow-x-auto rounded-lg border border-studio-border">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-studio-900 border-b border-studio-border text-[11px] font-bold text-slate-300">
                  <th className="p-2.5 text-slate-500 w-12 text-center">#</th>
                  {tableColumns.map((col) => (
                    <th
                      key={col}
                      onClick={() => handleSort(col)}
                      className="p-2.5 hover:bg-studio-850 cursor-pointer transition-colors select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{col}</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-500" />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-studio-border/60">
                {tableRows.length === 0 ? (
                  <tr>
                    <td colSpan={tableColumns.length + 1} className="p-6 text-center text-slate-500">
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  tableRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-studio-900/60 transition-colors">
                      <td className="p-2.5 text-center text-slate-500 text-[10px]">{idx + 1}</td>
                      {tableColumns.map((col) => {
                        const val = row[col]
                        const isObj = typeof val === 'object' && val !== null
                        return (
                          <td key={col} className="p-2.5 text-slate-300 truncate max-w-xs">
                            {isObj ? (
                              <span className="text-indigo-400 bg-studio-900 px-1.5 py-0.5 rounded text-[10px]">
                                {JSON.stringify(val)}
                              </span>
                            ) : val === null || val === undefined ? (
                              <span className="text-slate-600 italic">null</span>
                            ) : typeof val === 'boolean' ? (
                              <span className={val ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                {String(val)}
                              </span>
                            ) : typeof val === 'number' ? (
                              <span className="text-amber-300">{val}</span>
                            ) : (
                              <span>{String(val)}</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Markdown View */}
        {viewMode === 'markdown' && (
          <div className="prose prose-invert max-w-none font-sans text-sm p-2 leading-relaxed text-slate-200">
            <pre className="font-mono text-xs whitespace-pre-wrap bg-studio-900 p-4 rounded-xl border border-studio-border">
              {analysis.markdownString || (typeof data === 'string' ? data : JSON.stringify(data, null, 2))}
            </pre>
          </div>
        )}

        {/* 5. Media View */}
        {viewMode === 'media' && analysis.base64Image && (
          <div className="flex flex-col items-center justify-center p-6 space-y-4">
            <div className="p-2 rounded-2xl border border-studio-border bg-studio-900 shadow-2xl max-w-xl overflow-hidden">
              <img
                src={analysis.base64Image}
                alt="Tool Output Preview"
                className="max-h-[60vh] rounded-xl object-contain"
              />
            </div>
            <a
              href={analysis.base64Image}
              download="mcp-output-image.png"
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-sans text-xs font-semibold"
            >
              Download Image
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

// Collapsible Interactive JSON Tree Node Component
interface JsonTreeNodeProps {
  data: any
  name?: string
  isRoot?: boolean
}

const JsonTreeNode: React.FC<JsonTreeNodeProps> = ({ data, name, isRoot }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(isRoot ? true : true)

  const isObject = data !== null && typeof data === 'object'
  const isArray = Array.isArray(data)

  if (!isObject) {
    let valColor = 'text-emerald-300'
    if (typeof data === 'number') valColor = 'text-amber-300'
    if (typeof data === 'boolean') valColor = data ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'
    if (data === null || data === undefined) valColor = 'text-slate-500 italic'

    return (
      <div className="flex items-center gap-1.5 py-0.5 pl-4 hover:bg-studio-900/50 rounded px-1 group">
        {name && <span className="text-cyan-400 font-semibold">{name}:</span>}
        <span className={`${valColor} select-text`}>
          {typeof data === 'string' ? `"${data}"` : String(data)}
        </span>
      </div>
    )
  }

  const keys = Object.keys(data)
  const preview = isArray ? `[${keys.length} items]` : `{${keys.length} keys}`

  return (
    <div className="pl-2">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 py-0.5 hover:bg-studio-900/70 rounded px-1 cursor-pointer select-none text-slate-300 group"
      >
        <span className="text-slate-500 group-hover:text-white">
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </span>
        {name && <span className="text-indigo-300 font-bold">{name}:</span>}
        <span className="text-slate-500 text-[10px]">{preview}</span>
      </div>

      {isExpanded && (
        <div className="border-l border-studio-border/60 ml-2 pl-2 space-y-0.5">
          {keys.map((k) => (
            <JsonTreeNode key={k} name={k} data={data[k]} />
          ))}
        </div>
      )}
    </div>
  )
}
