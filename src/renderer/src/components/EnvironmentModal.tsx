import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2, Key, Eye, EyeOff, Save, Check } from 'lucide-react'
import { EnvironmentProfile, EnvironmentVariable } from '../../../shared/types'

interface EnvironmentModalProps {
  isOpen: boolean
  onClose: () => void
  onEnvironmentChanged: () => void
}

export const EnvironmentModal: React.FC<EnvironmentModalProps> = ({
  isOpen,
  onClose,
  onEnvironmentChanged
}) => {
  const [environments, setEnvironments] = useState<EnvironmentProfile[]>([])
  const [selectedEnvId, setSelectedEnvId] = useState<string>('')
  const [activeEnv, setActiveEnv] = useState<EnvironmentProfile | null>(null)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadEnvironments()
    }
  }, [isOpen])

  const loadEnvironments = async () => {
    const list = await window.api.storage.getEnvironments()
    setEnvironments(list)
    const currentActive = await window.api.storage.getActiveEnvironment()
    if (currentActive) {
      setSelectedEnvId(currentActive.id)
      setActiveEnv(JSON.parse(JSON.stringify(currentActive)))
    } else if (list[0]) {
      setSelectedEnvId(list[0].id)
      setActiveEnv(JSON.parse(JSON.stringify(list[0])))
    }
  }

  const handleSelectEnv = (env: EnvironmentProfile) => {
    setSelectedEnvId(env.id)
    setActiveEnv(JSON.parse(JSON.stringify(env)))
  }

  const handleAddVariable = () => {
    if (!activeEnv) return
    const newVar: EnvironmentVariable = {
      key: '',
      value: '',
      enabled: true
    }
    setActiveEnv({
      ...activeEnv,
      variables: [...activeEnv.variables, newVar]
    })
  }

  const handleUpdateVar = (index: number, field: keyof EnvironmentVariable, val: any) => {
    if (!activeEnv) return
    const updated = [...activeEnv.variables]
    const item = updated[index]
    if (!item) return
    updated[index] = {
      ...item,
      [field]: val
    }
    setActiveEnv({
      ...activeEnv,
      variables: updated
    })
  }

  const handleDeleteVar = (index: number) => {
    if (!activeEnv) return
    const updated = activeEnv.variables.filter((_, i) => i !== index)
    setActiveEnv({
      ...activeEnv,
      variables: updated
    })
  }

  const handleCreateEnv = () => {
    const newProfile: EnvironmentProfile = {
      id: 'env_' + crypto.randomUUID(),
      name: 'New Environment',
      variables: [
        { key: 'API_URL', value: 'http://localhost:3000', enabled: true }
      ]
    }
    setEnvironments([...environments, newProfile])
    setSelectedEnvId(newProfile.id)
    setActiveEnv(newProfile)
  }

  const handleSave = async () => {
    if (!activeEnv) return
    await window.api.storage.saveEnvironment(activeEnv)
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2000)
    onEnvironmentChanged()
  }

  const handleSetAsActive = async () => {
    if (!activeEnv) return
    await window.api.storage.setActiveEnvironment(activeEnv.id)
    onEnvironmentChanged()
  }

  if (!isOpen) return null

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-studio-900 border border-studio-border rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-studio-border flex items-center justify-between bg-studio-950/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shadow-sm">
              <Key className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white">Environment Variables & Profiles</h2>
              <p className="text-xs text-slate-400 font-medium">Manage multi-stage secrets and variable injection</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Environments List */}
          <div className="w-56 border-r border-studio-border p-3 flex flex-col justify-between bg-studio-950/30">
            <div className="space-y-1 overflow-y-auto">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                Profiles
              </div>
              {environments.map((env) => (
                <button
                  key={env.id}
                  onClick={() => handleSelectEnv(env)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors shadow-sm ${
                    selectedEnvId === env.id
                      ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-900 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30'
                      : 'bg-transparent text-slate-400 hover:bg-studio-800 hover:text-slate-200 border border-slate-200 dark:border-transparent'
                  }`}
                >
                  <span className="truncate">{env.name}</span>
                </button>
              ))}
            </div>

            <button
              onClick={handleCreateEnv}
              className="mt-2 w-full py-2 px-3 rounded-xl border border-dashed border-studio-border text-xs font-bold text-slate-400 hover:text-white hover:border-slate-400 dark:hover:border-slate-500 flex items-center justify-center gap-1.5 transition-colors bg-transparent shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Profile</span>
            </button>
          </div>

          {/* Right: Variables Table */}
          <div className="flex-1 p-5 overflow-y-auto flex flex-col justify-between bg-transparent">
            {activeEnv ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <input
                    type="text"
                    value={activeEnv.name}
                    onChange={(e) => setActiveEnv({ ...activeEnv, name: e.target.value })}
                    className="bg-studio-950 border border-studio-border rounded-xl px-3 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-cyan-500 w-64 shadow-sm"
                    placeholder="Environment Name"
                  />
                  <button
                    onClick={handleSetAsActive}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-studio-800 hover:bg-studio-700 text-slate-200 border border-studio-border transition-colors shadow-sm"
                  >
                    Set as Active Profile
                  </button>
                </div>

                <p className="text-xs text-slate-400 font-medium">
                  Reference these variables in tool arguments using double curly braces (e.g.{' '}
                  <code className="text-cyan-700 dark:text-cyan-300 bg-studio-950 px-1.5 py-0.5 rounded-md font-mono border border-studio-border font-bold">
                    {'{{API_URL}}'}
                  </code>
                  ).
                </p>

                {/* Variables List */}
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                    <span className="col-span-1 text-center">Use</span>
                    <span className="col-span-4">Variable Name</span>
                    <span className="col-span-6">Value</span>
                    <span className="col-span-1 text-right">Actions</span>
                  </div>

                  {activeEnv.variables.map((v, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-1 flex justify-center">
                        <input
                          type="checkbox"
                          checked={v.enabled}
                          onChange={(e) => handleUpdateVar(idx, 'enabled', e.target.checked)}
                          className="rounded bg-studio-950 border-studio-border text-cyan-500 focus:ring-0 w-4 h-4 cursor-pointer"
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          type="text"
                          value={v.key}
                          onChange={(e) => handleUpdateVar(idx, 'key', e.target.value.toUpperCase())}
                          placeholder="VARIABLE_KEY"
                          className="w-full bg-studio-950 border border-studio-border rounded-xl px-2.5 py-1.5 text-xs font-mono text-cyan-800 dark:text-cyan-300 focus:outline-none focus:border-cyan-500 shadow-sm font-bold"
                        />
                      </div>
                      <div className="col-span-6 relative">
                        <input
                          type={v.isSecret && !showSecrets[idx] ? 'password' : 'text'}
                          value={v.value}
                          onChange={(e) => handleUpdateVar(idx, 'value', e.target.value)}
                          placeholder="Variable Value"
                          className="w-full bg-studio-950 border border-studio-border rounded-xl px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 pr-8 shadow-sm font-medium"
                        />
                        {v.isSecret && (
                          <button
                            type="button"
                            onClick={() =>
                              setShowSecrets({ ...showSecrets, [idx]: !showSecrets[idx] })
                            }
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                          >
                            {showSecrets[idx] ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                      <div className="col-span-1 flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleDeleteVar(idx)}
                          className="text-slate-400 hover:text-rose-500 p-1 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={handleAddVariable}
                    className="py-1.5 px-3 rounded-xl border border-studio-border text-xs font-bold text-cyan-400 bg-transparent hover:bg-cyan-50 dark:hover:bg-cyan-500/10 flex items-center gap-1.5 transition-colors mt-2 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Variable</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-xs text-slate-500 py-12 font-medium">
                Select or create an environment profile
              </div>
            )}

            {/* Footer buttons */}
            <div className="mt-6 pt-4 border-t border-studio-border flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-studio-800 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/30 flex items-center gap-1.5 transition-all"
              >
                {isSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
