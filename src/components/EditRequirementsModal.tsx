'use client'
import { useState } from 'react'
import { X, Save, AlertTriangle, RefreshCw } from 'lucide-react'
import { useWorkflow } from '@/context/workflow'
import { WORKFLOW_TYPE_LABELS, ROLE_LABELS } from '@/lib/config'
import type { WorkflowInput, WorkflowType, UserRole } from '@/lib/types'

interface Props { onClose: () => void }

export default function EditRequirementsModal({ onClose }: Props) {
  const { workflow, updateWorkflowInput } = useWorkflow()
  if (!workflow) return null

  const [form, setForm] = useState<WorkflowInput>({ ...workflow.input })
  const [showWarning, setShowWarning] = useState(false)

  function set<K extends keyof WorkflowInput>(k: K, v: WorkflowInput[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  const hasApprovedPhases = workflow.phases.some(p => p.status === 'approved')
  const changed = JSON.stringify(form) !== JSON.stringify(workflow.input)

  function handleSave() {
    if (hasApprovedPhases && !showWarning) { setShowWarning(true); return }
    updateWorkflowInput(form)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl flex flex-col"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>

        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b z-10"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
          <div>
            <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Edit Requirements</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-dimmer)' }}>
              Update your workflow input — previously generated phases will use the new context on next generation
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-dimmer)' }}><X size={18} /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Warning if approved phases exist */}
          {hasApprovedPhases && (
            <div className="flex items-start gap-3 p-4 rounded-xl"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}>
              <AlertTriangle size={16} className="mt-0.5 shrink-0" style={{ color: '#F59E0B' }} />
              <div>
                <p className="text-sm font-semibold mb-0.5" style={{ color: '#F59E0B' }}>Approved phases will not auto-regenerate</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Changes here update the requirements context. Approved phases are preserved — use the Regenerate button on each phase to re-run it with the updated requirements if needed.
                </p>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Feature / Story Title
            </label>
            <input
              value={form.title}
              onChange={e => set('title', e.target.value)}
              className="input-themed"
              placeholder="Feature title…"
            />
          </div>

          {/* Type + Role */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Workflow Type</label>
              <select value={form.workflowType} onChange={e => set('workflowType', e.target.value as WorkflowType)} className="input-themed">
                {Object.entries(WORKFLOW_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Role</label>
              <select value={form.userRole} onChange={e => set('userRole', e.target.value as UserRole)} className="input-themed">
                {Object.entries(ROLE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Description &amp; Requirements
            </label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={8}
              className="input-themed resize-y"
              placeholder="Describe the feature, requirements, constraints…"
            />
          </div>

          {/* Additional context */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Additional Context <span style={{ color: 'var(--text-dimmer)' }}>(optional)</span>
            </label>
            <input
              value={form.additionalContext ?? ''}
              onChange={e => set('additionalContext', e.target.value)}
              className="input-themed"
              placeholder="Team size, stack, constraints…"
            />
          </div>

          {/* Confirm warning step */}
          {showWarning && (
            <div className="p-4 rounded-xl" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)' }}>
              <p className="text-sm font-semibold mb-1" style={{ color: '#F59E0B' }}>Confirm update</p>
              <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                You have approved phases. The requirements will update and future phase generations will use the new context. Previously approved phase content stays as-is until you regenerate them.
              </p>
              <div className="flex gap-2">
                <button onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-semibold text-sm text-white"
                  style={{ background: 'linear-gradient(135deg,#F59E0B,#EF4444)' }}>
                  <RefreshCw size={13} /> Yes, Update Requirements
                </button>
                <button onClick={() => setShowWarning(false)}
                  className="flex-1 py-2 rounded-xl font-medium text-sm"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!showWarning && (
          <div className="sticky bottom-0 px-6 py-4 border-t" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
            <div className="flex gap-3">
              <button onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={!changed || !form.title.trim() || !form.description.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white disabled:opacity-40"
                style={{ background: 'var(--accent-grad)' }}>
                <Save size={14} /> Save Requirements
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
