'use client'
import { useState } from 'react'
import { Loader2, Play, ThumbsUp, ThumbsDown, RefreshCw, AlertCircle, Info, Square, Pencil, FileText, ChevronDown } from 'lucide-react'
import { useWorkflow } from '@/context/workflow'
import ConfidenceScore from './ConfidenceScore'
import ArtifactSection from './ArtifactSection'
import PhaseActions from './PhaseActions'
import { WORKFLOW_TYPE_LABELS, ROLE_LABELS } from '@/lib/config'

interface Props {
  onNeedAuth: (retryFn?: () => void) => void
  onOpenIntegrations: () => void
  onEditRequirements: () => void
}

export default function PhasePanel({ onNeedAuth, onOpenIntegrations, onEditRequirements }: Props) {
  const { workflow, viewingPhaseId, generatePhase, cancelGeneration, approvePhase, rejectPhase, isGenerating, generatingPhaseId, error } = useWorkflow()
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [showRequirements, setShowRequirements] = useState(false)

  if (!workflow) return null

  const phase = workflow.phases.find(p => p.id === viewingPhaseId)
    ?? workflow.phases[workflow.currentPhaseIndex]
  if (!phase) return null

  function handleGenerate() { generatePhase(phase.id, undefined, onNeedAuth) }
  function handleApprove() { approvePhase(phase.id); setShowFeedback(false); setFeedback('') }
  function handleReject() {
    if (!feedback.trim()) return
    rejectPhase(phase.id, feedback.trim(), onNeedAuth)
    setShowFeedback(false)
    setFeedback('')
  }

  const isThisGenerating = isGenerating && generatingPhaseId === phase.id
  const isOtherGenerating = isGenerating && generatingPhaseId !== phase.id

  return (
    <div className="flex-1 min-w-0 space-y-4">

      {/* Requirements summary — collapsible, always visible */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
        <button
          className="w-full flex items-center justify-between px-5 py-3"
          onClick={() => setShowRequirements(v => !v)}
          style={{ borderBottom: showRequirements ? '1px solid var(--border-default)' : 'none' }}
        >
          <div className="flex items-center gap-2 text-left">
            <FileText size={14} style={{ color: 'var(--accent-blue)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {workflow.input.title}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-dimmer)', border: '1px solid var(--border-default)' }}>
              {WORKFLOW_TYPE_LABELS[workflow.input.workflowType]}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-dimmer)', border: '1px solid var(--border-default)' }}>
              {ROLE_LABELS[workflow.input.userRole]}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={e => { e.stopPropagation(); onEditRequirements() }}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium transition-colors"
              style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--accent-blue)', border: '1px solid rgba(59,130,246,0.3)' }}>
              <Pencil size={11} /> Edit
            </button>
            <ChevronDown size={14} style={{ color: 'var(--text-dimmer)', transform: showRequirements ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </div>
        </button>
        {showRequirements && (
          <div className="px-5 py-4">
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
              {workflow.input.description}
            </p>
            {workflow.input.additionalContext && (
              <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-default)' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-dimmer)' }}>Additional context</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{workflow.input.additionalContext}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Phase header */}
      <div className="flex items-start justify-between gap-4 p-5 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
        <div className="flex items-start gap-3">
          <span className="text-3xl mt-0.5">{phase.icon}</span>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{phase.name}</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{phase.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Stop button — shown when THIS phase is generating */}
          {isThisGenerating && (
            <button onClick={cancelGeneration}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.3)' }}>
              <Square size={13} fill="currentColor" /> Stop
            </button>
          )}

          {(phase.status === 'ready' || phase.status === 'review') && !isThisGenerating && (
            <button onClick={handleGenerate} disabled={!!isOtherGenerating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
              style={{ background: 'var(--accent-grad)' }}>
              {phase.status === 'review' ? <><RefreshCw size={14} /> Regenerate</> : <><Play size={14} /> Generate Phase</>}
            </button>
          )}
          {phase.status === 'approved' && (
            <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}>
              ✓ Approved
            </span>
          )}
          {phase.status === 'locked' && (
            <span className="text-xs px-3 py-2 rounded-xl font-medium"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-dimmer)' }}>
              🔒 Locked
            </span>
          )}
        </div>
      </div>

      {/* Error */}
      {error && !isThisGenerating && (
        <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
          <div className="flex-1">
            <p className="text-sm text-red-400">{error}</p>
            <button onClick={handleGenerate} className="mt-2 text-xs underline" style={{ color: '#FCA5A5' }}>Try again</button>
          </div>
        </div>
      )}

      {/* Generating state */}
      {isThisGenerating && (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 size={36} className="animate-spin mb-4" style={{ color: 'var(--accent-blue)' }} />
            <p className="font-semibold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
              Generating {phase.name} artifacts…
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              AI is crafting comprehensive SDLC artifacts — this takes ~20–40 seconds
            </p>
            <button onClick={cancelGeneration}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.3)' }}>
              <Square size={13} fill="currentColor" /> Stop Generation
            </button>
          </div>

          {/* Show requirements reminder while generating */}
          <div className="border-t px-5 py-3" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-elevated)' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-dimmer)' }}>Generating artifacts based on:</p>
            <p className="text-xs leading-relaxed line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
              {workflow.input.description.slice(0, 200)}
              {workflow.input.description.length > 200 ? '…' : ''}
            </p>
            <button onClick={() => { cancelGeneration(); onEditRequirements() }}
              className="mt-2 flex items-center gap-1 text-xs font-medium"
              style={{ color: 'var(--accent-blue)' }}>
              <Pencil size={10} /> Stop &amp; edit requirements
            </button>
          </div>
        </div>
      )}

      {/* Ready / Locked states */}
      {!isThisGenerating && (phase.status === 'ready' || phase.status === 'locked') && (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
          <span className="text-5xl mb-4">{phase.icon}</span>
          <p className="font-semibold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
            {phase.status === 'locked' ? 'Phase Locked' : 'Ready to Generate'}
          </p>
          <p className="text-sm max-w-sm text-center mb-5" style={{ color: 'var(--text-secondary)' }}>
            {phase.status === 'locked'
              ? 'Approve the previous phase to unlock this one.'
              : 'Generate comprehensive AI artifacts for this phase. You can review, edit, and push them to your tools.'}
          </p>
          {phase.status === 'ready' && (
            <div className="flex flex-col items-center gap-3">
              <button onClick={handleGenerate} disabled={!!isOtherGenerating}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white disabled:opacity-40"
                style={{ background: 'var(--accent-grad)' }}>
                <Play size={15} /> Generate {phase.shortName} Artifacts
              </button>
              <button onClick={onEditRequirements}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>
                <Pencil size={11} /> Edit requirements before generating
              </button>
            </div>
          )}
        </div>
      )}

      {/* Output */}
      {!isThisGenerating && phase.output && (
        <>
          <ConfidenceScore score={phase.output.confidence} rationale={phase.output.confidenceRationale} />

          {phase.output.keyAssumptions.length > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <Info size={15} className="mt-0.5 shrink-0" style={{ color: 'var(--accent-blue)' }} />
              <div>
                <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--accent-blue)' }}>Key Assumptions Made</p>
                <ul className="space-y-1">
                  {phase.output.keyAssumptions.map((a, i) => (
                    <li key={i} className="text-xs" style={{ color: 'var(--text-secondary)' }}>• {a}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {phase.output.sections.map(section => (
              <ArtifactSection key={section.id} phaseId={phase.id} section={section} />
            ))}
          </div>

          {(phase.status === 'review' || phase.status === 'approved') && (
            <PhaseActions
              phaseId={phase.id}
              phaseName={phase.name}
              workflowTitle={workflow.input.title}
              output={phase.output}
              onOpenSettings={onOpenIntegrations}
            />
          )}

          {phase.status === 'review' && (
            <div className="p-5 rounded-2xl space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Review complete? What would you like to do?</p>
              <div className="flex gap-3">
                <button onClick={handleApprove}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white"
                  style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                  <ThumbsUp size={15} /> Approve &amp; Proceed
                </button>
                <button onClick={() => setShowFeedback(s => !s)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>
                  <ThumbsDown size={15} /> Revise with Feedback
                </button>
              </div>
              {showFeedback && (
                <div className="space-y-2">
                  <textarea
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    placeholder="What should the AI change? Be specific — e.g. 'Add OWASP top 10 to security section', 'Include error codes in API contracts', 'Split the epic into smaller stories'…"
                    rows={4}
                    className="input-themed resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleReject} disabled={!feedback.trim()}
                      className="flex-1 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
                      style={{ background: 'var(--accent-grad)' }}>
                      Submit &amp; Regenerate
                    </button>
                    <button onClick={() => { setShowFeedback(false); onEditRequirements() }}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>
                      <Pencil size={12} /> Edit requirements
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {phase.status === 'approved' && (
            <div className="flex items-center justify-between p-4 rounded-xl"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#10B981' }}>Phase Approved ✓</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-dimmer)' }}>
                  {phase.approvedAt ? `Approved ${new Date(phase.approvedAt).toLocaleString()}` : ''}
                  {phase.revisionsCount > 0 ? ` · ${phase.revisionsCount} revision(s)` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={onEditRequirements}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>
                  <Pencil size={11} /> Edit reqs
                </button>
                <button onClick={() => generatePhase(phase.id, undefined, onNeedAuth)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>
                  <RefreshCw size={12} /> Re-generate
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
