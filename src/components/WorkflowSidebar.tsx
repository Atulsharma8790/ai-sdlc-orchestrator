'use client'
import { CheckCircle, Clock, Lock, AlertCircle, Loader2, ChevronDown, ChevronRight, Square } from 'lucide-react'
import { useState } from 'react'
import { useWorkflow } from '@/context/workflow'
import { PHASE_SECTIONS } from '@/lib/prompts'
import type { PhaseStatus, PhaseId } from '@/lib/types'

interface Props { onNeedAuth?: (retryFn?: () => void) => void }

const STATUS_ICON: Record<PhaseStatus, React.ReactNode> = {
  locked:     <Lock size={10} />,
  ready:      <Clock size={10} />,
  generating: <Loader2 size={10} className="animate-spin" />,
  review:     <AlertCircle size={10} />,
  approved:   <CheckCircle size={10} />,
}

const STATUS_COLOR: Record<PhaseStatus, string> = {
  locked:     'var(--text-dimmer)',
  ready:      'var(--accent-blue)',
  generating: 'var(--accent-violet)',
  review:     '#F59E0B',
  approved:   '#10B981',
}

const STATUS_LABEL: Record<PhaseStatus, string> = {
  locked:     'Locked',
  ready:      'Ready to generate',
  generating: 'Generating…',
  review:     'Awaiting review',
  approved:   'Approved ✓',
}

function PhaseRow({ phase, isViewing, onSelect, onCancel, isActivelyGenerating }: {
  phase: { id: PhaseId; name: string; shortName: string; icon: string; description: string; status: PhaseStatus; revisionsCount: number; approvedAt?: string }
  isViewing: boolean
  onSelect: () => void
  onCancel?: () => void
  isActivelyGenerating: boolean
}) {
  const [expanded, setExpanded] = useState(isViewing)
  const clickable = phase.status !== 'locked'
  const sections = PHASE_SECTIONS[phase.id] ?? []
  const color = STATUS_COLOR[phase.status]

  // Auto-expand when being viewed
  const isOpen = expanded || isViewing

  return (
    <div className="border-b last:border-0 transition-colors" style={{ borderColor: 'var(--border-default)' }}>
      {/* Phase row — clickable */}
      <div
        className="relative flex items-start gap-2.5 px-3 py-3 cursor-pointer select-none"
        style={{
          background: isViewing ? 'rgba(59,130,246,0.08)' : 'transparent',
          opacity: phase.status === 'locked' ? 0.45 : 1,
          cursor: clickable ? 'pointer' : 'default',
        }}
        onClick={() => {
          if (clickable) { onSelect(); setExpanded(true) }
        }}
      >
        {/* Active bar */}
        {isViewing && (
          <span className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r"
            style={{ background: 'var(--accent-blue)' }} />
        )}

        {/* Icon */}
        <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-sm mt-0.5"
          style={{
            background: isViewing ? 'rgba(59,130,246,0.15)' : 'var(--bg-elevated)',
            border: isViewing ? '1px solid rgba(59,130,246,0.3)' : '1px solid var(--border-default)',
          }}>
          {phase.icon}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + expand toggle */}
          <div className="flex items-center gap-1">
            <p className="text-xs font-semibold leading-tight flex-1" style={{ color: isViewing ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
              {phase.shortName}
            </p>
            {clickable && (
              <button
                onClick={e => { e.stopPropagation(); setExpanded(v => !v) }}
                className="p-0.5 rounded transition-colors" style={{ color: 'var(--text-dimmer)' }}>
                {isOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              </button>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center gap-1 mt-0.5">
            <span style={{ color }}>{STATUS_ICON[phase.status]}</span>
            <span className="text-[10px] font-medium" style={{ color }}>
              {STATUS_LABEL[phase.status]}
            </span>
            {phase.revisionsCount > 0 && (
              <span className="text-[10px]" style={{ color: 'var(--text-dimmer)' }}>· {phase.revisionsCount}r</span>
            )}
          </div>

          {/* Stop button during generation */}
          {isActivelyGenerating && onCancel && (
            <button
              onClick={e => { e.stopPropagation(); onCancel() }}
              className="mt-2 flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.25)' }}>
              <Square size={9} fill="currentColor" /> Stop
            </button>
          )}
        </div>
      </div>

      {/* Expanded: description + sections */}
      {isOpen && clickable && (
        <div className="px-3 pb-3 ml-9 space-y-2">
          <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-dimmer)' }}>
            {phase.description}
          </p>
          <div className="space-y-0.5">
            <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-dimmer)' }}>
              Generates:
            </p>
            {sections.map(s => (
              <div key={s.id} className="flex items-center gap-1.5">
                <span className="text-xs">{s.icon}</span>
                <span className="text-[10px]" style={{ color: phase.status === 'approved' ? '#10B981' : 'var(--text-dimmer)' }}>
                  {s.title}
                </span>
                {phase.status === 'approved' && (
                  <CheckCircle size={9} className="shrink-0" style={{ color: '#10B981' }} />
                )}
              </div>
            ))}
          </div>
          {phase.approvedAt && (
            <p className="text-[9px]" style={{ color: 'var(--text-dimmer)' }}>
              Approved {new Date(phase.approvedAt).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default function WorkflowSidebar({ onNeedAuth }: Props = {}) {
  const { workflow, viewingPhaseId, setViewingPhaseId, isGenerating, generatingPhaseId, cancelGeneration } = useWorkflow()
  if (!workflow) return null

  const { phases } = workflow
  const totalApproved = phases.filter(p => p.status === 'approved').length
  const progress = Math.round((totalApproved / phases.length) * 100)

  return (
    <aside className="flex flex-col gap-3">
      {/* Progress */}
      <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>SDLC Progress</span>
          <span className="text-xs font-bold" style={{ color: 'var(--accent-blue)' }}>{totalApproved}/{phases.length}</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-violet))' }} />
        </div>
        <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-dimmer)' }}>
          {progress === 100 ? '🎉 All phases complete!' : `${progress}% · ${phases.length - totalApproved} remaining`}
        </p>
      </div>

      {/* Phase nav */}
      <nav className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
        <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-dimmer)' }}>
            Phases — click to view &amp; expand
          </p>
        </div>

        {phases.map(phase => (
          <PhaseRow
            key={phase.id}
            phase={phase}
            isViewing={viewingPhaseId === phase.id}
            onSelect={() => setViewingPhaseId(phase.id)}
            isActivelyGenerating={isGenerating && generatingPhaseId === phase.id}
            onCancel={cancelGeneration}
          />
        ))}
      </nav>
    </aside>
  )
}
