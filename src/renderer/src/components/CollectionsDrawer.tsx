import React, { useState, useEffect } from 'react'
import {
  Folder,
  Bookmark,
  History,
  Trash2,
  Play,
  CheckCircle2,
  AlertTriangle,
  Search,
  Plus,
  X
} from 'lucide-react'
import {
  RequestCollection,
  SavedRequest,
  ToolExecutionHistory
} from '../../../shared/types'

interface CollectionsDrawerProps {
  isOpen: boolean
  onClose: () => void
  onLoadRequest: (request: SavedRequest) => void
  onReplayHistory: (entry: ToolExecutionHistory) => void
}

export const CollectionsDrawer: React.FC<CollectionsDrawerProps> = ({
  isOpen,
  onClose,
  onLoadRequest,
  onReplayHistory
}) => {
  const [tab, setTab] = useState<'collections' | 'history'>('collections')
  const [collections, setCollections] = useState<RequestCollection[]>([])
  const [standaloneRequests, setStandaloneRequests] = useState<SavedRequest[]>([])
  const [history, setHistory] = useState<ToolExecutionHistory[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [newCollectionName, setNewCollectionName] = useState('')
  const [isCreatingCollection, setIsCreatingCollection] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen, tab])

  const loadData = async () => {
    const cols = await window.api.storage.getCollections()
    setCollections(cols)
    const standalones = await window.api.storage.getStandaloneRequests()
    setStandaloneRequests(standalones)
    const hist = await window.api.storage.getHistory(50)
    setHistory(hist)
  }

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return
    await window.api.storage.createCollection(newCollectionName.trim())
    setNewCollectionName('')
    setIsCreatingCollection(false)
    loadData()
  }

  const handleDeleteRequest = async (requestId: string, collectionId?: string) => {
    await window.api.storage.deleteRequest(requestId, collectionId)
    loadData()
  }

  const handleDeleteCollection = async (collectionId: string) => {
    await window.api.storage.deleteCollection(collectionId)
    loadData()
  }

  const handleClearHistory = async () => {
    await window.api.storage.clearHistory()
    setHistory([])
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-96 bg-studio-900 border-l border-studio-border shadow-2xl flex flex-col backdrop-blur-md">
      {/* Drawer Header */}
      <div className="p-4 border-b border-studio-border flex items-center justify-between bg-studio-950/60">
        <div className="flex items-center gap-2">
          <div className="flex bg-studio-900 p-0.5 rounded-lg border border-studio-border text-xs font-semibold">
            <button
              onClick={() => setTab('collections')}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 font-bold ${
                tab === 'collections'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Collections</span>
            </button>
            <button
              onClick={() => setTab('history')}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 font-bold ${
                tab === 'history'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>History</span>
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search & Actions Bar */}
      <div className="p-3 border-b border-studio-border bg-studio-950/30 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder={tab === 'collections' ? 'Filter saved requests...' : 'Filter history...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-studio-950 border border-studio-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-sm font-medium"
          />
        </div>

        {tab === 'collections' && (
          <button
            onClick={() => setIsCreatingCollection(true)}
            className="p-1.5 rounded-lg border border-studio-border bg-studio-950 text-indigo-400 hover:text-indigo-800 dark:hover:text-white hover:bg-studio-800 transition-colors shadow-sm"
            title="New Collection"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}

        {tab === 'history' && history.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="text-[11px] font-bold text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 px-2 py-1 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* New Collection Inline Form */}
      {isCreatingCollection && (
        <div className="p-3 border-b border-studio-border bg-studio-950/80 flex items-center gap-2">
          <input
            type="text"
            placeholder="Collection Name..."
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            className="flex-1 bg-studio-900 border border-studio-border rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 shadow-sm font-medium"
            autoFocus
          />
          <button
            onClick={handleCreateCollection}
            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm"
          >
            Create
          </button>
          <button
            onClick={() => setIsCreatingCollection(false)}
            className="text-slate-500 hover:text-white p-1 text-xs font-medium"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Main Drawer Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-transparent">
        {tab === 'collections' ? (
          <div className="space-y-4">
            {/* Render Collections */}
            {collections.map((col) => (
              <div
                key={col.id}
                className="border border-studio-border rounded-2xl bg-studio-950/50 overflow-hidden shadow-sm"
              >
                <div className="px-3 py-2 bg-studio-950 flex items-center justify-between border-b border-studio-border/60">
                  <div className="flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs font-bold text-slate-200">{col.name}</span>
                    <span className="text-[10px] text-slate-500">({col.requests.length})</span>
                  </div>
                  <button
                    onClick={() => handleDeleteCollection(col.id)}
                    className="text-slate-400 hover:text-rose-400 p-1"
                    title="Delete Collection"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-studio-border/40">
                  {col.requests.length === 0 ? (
                    <div className="p-3 text-center text-[11px] text-slate-500">
                      Empty collection. Save requests from the Tool Inspector.
                    </div>
                  ) : (
                    col.requests
                      .filter(
                        (r) =>
                          r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.toolName.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((req) => (
                        <div
                          key={req.id}
                          className="p-2.5 flex items-center justify-between hover:bg-studio-900/80 transition-colors group"
                        >
                          <div
                            onClick={() => {
                              onLoadRequest(req)
                              onClose()
                            }}
                            className="cursor-pointer flex-1 mr-2"
                          >
                            <div className="text-xs font-bold text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                              {req.name}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1 mt-0.5">
                              <span className="text-cyan-400 font-semibold">{req.serverName}</span> •{' '}
                              <span className="text-indigo-400 font-semibold">{req.toolName}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                onLoadRequest(req)
                                onClose()
                              }}
                              className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white transition-colors"
                              title="Load & Run"
                            >
                              <Play className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteRequest(req.id, col.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            ))}

            {/* Standalone Requests */}
            {standaloneRequests.length > 0 && (
              <div className="border border-studio-border rounded-2xl bg-studio-950/50 overflow-hidden shadow-sm">
                <div className="px-3 py-2 bg-studio-950 flex items-center justify-between border-b border-studio-border/60">
                  <div className="flex items-center gap-1.5">
                    <Bookmark className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                    <span className="text-xs font-bold text-slate-200">Standalone Saved</span>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-studio-border/40">
                  {standaloneRequests
                    .filter(
                      (r) =>
                        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        r.toolName.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((req) => (
                      <div
                        key={req.id}
                        className="p-2.5 flex items-center justify-between hover:bg-studio-900/80 transition-colors group"
                      >
                        <div
                          onClick={() => {
                            onLoadRequest(req)
                            onClose()
                          }}
                          className="cursor-pointer flex-1 mr-2"
                        >
                          <div className="text-xs font-bold text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                            {req.name}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1 mt-0.5">
                            <span className="text-cyan-400 font-semibold">{req.serverName}</span> •{' '}
                            <span className="text-indigo-400 font-semibold">{req.toolName}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              onLoadRequest(req)
                              onClose()
                            }}
                            className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white transition-colors"
                            title="Load & Run"
                          >
                            <Play className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteRequest(req.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {collections.length === 0 && standaloneRequests.length === 0 && (
              <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-xs">
                <Bookmark className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                <p className="font-bold">No saved requests yet.</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Save test parameters from the Tool Inspector.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* History View */
          <div className="space-y-2">
            {history.length === 0 ? (
              <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-xs">
                <History className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                <p className="font-bold">No execution history yet.</p>
              </div>
            ) : (
              history
                .filter(
                  (h) =>
                    h.toolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    h.serverName.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3 rounded-2xl border border-studio-border bg-studio-950/70 hover:border-indigo-500/40 transition-colors group flex items-start justify-between gap-2 shadow-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        {entry.success ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                        )}
                        <span className="text-xs font-mono font-bold text-slate-200 truncate">
                          {entry.toolName}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ml-auto font-bold ${
                            entry.success
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                              : 'bg-rose-950/40 text-rose-400 border-rose-800/40'
                          }`}
                        >
                          {entry.durationMs}ms
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-500 truncate">
                        Server: <span className="text-slate-400 font-semibold">{entry.serverName}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                        Args: {JSON.stringify(entry.arguments)}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onReplayHistory(entry)
                        onClose()
                      }}
                      className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 mt-1 shadow-sm"
                      title="Replay Execution"
                    >
                      <Play className="w-3 h-3" />
                    </button>
                  </div>
                ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
