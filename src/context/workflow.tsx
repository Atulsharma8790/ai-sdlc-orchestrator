'use client'
import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'
import { PHASE_DEFINITIONS } from '@/lib/config'
import { useAuth } from './auth'
import type { WorkflowState, WorkflowInput, PhaseId, PhaseOutput, WorkflowPhase } from '@/lib/types'

interface WorkflowCtx {
  workflow: WorkflowState | null
  viewingPhaseId: PhaseId | null
  setViewingPhaseId: (id: PhaseId) => void
  startWorkflow: (input: WorkflowInput) => void
  generatePhase: (phaseId: PhaseId, feedback?: string, onNeedAuth?: () => void) => Promise<void>
  cancelGeneration: () => void
  approvePhase: (phaseId: PhaseId) => void
  rejectPhase: (phaseId: PhaseId, feedback: string, onNeedAuth?: () => void) => void
  updateSectionContent: (phaseId: PhaseId, sectionId: string, content: string) => void
  updateWorkflowInput: (input: WorkflowInput) => void
  resetWorkflow: () => void
  isGenerating: boolean
  generatingPhaseId: PhaseId | null
  error: string | null
}

const WorkflowContext = createContext<WorkflowCtx | null>(null)

function buildInitialPhases(input: WorkflowInput): WorkflowPhase[] {
  return PHASE_DEFINITIONS.map((def, i) => ({
    ...def,
    status: i === 0 ? 'ready' : 'locked',
    revisionsCount: 0,
  })) as WorkflowPhase[]
}

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const { getHeaders } = useAuth()
  const [workflow, setWorkflow] = useState<WorkflowState | null>(null)
  const [viewingPhaseId, setViewingPhaseId] = useState<PhaseId | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingPhaseId, setGeneratingPhaseId] = useState<PhaseId | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  function startWorkflow(input: WorkflowInput) {
    const phases = buildInitialPhases(input)
    const state: WorkflowState = {
      id: Date.now().toString(),
      input,
      phases,
      currentPhaseIndex: 0,
      startedAt: new Date().toISOString(),
    }
    setWorkflow(state)
    setViewingPhaseId(phases[0].id)
    setError(null)
  }

  function cancelGeneration() {
    abortRef.current?.abort()
    abortRef.current = null
    setIsGenerating(false)
    setGeneratingPhaseId(prev => {
      // revert the cancelling phase back to its previous status
      setWorkflow(w => {
        if (!w || !prev) return w
        return {
          ...w,
          phases: w.phases.map(p =>
            p.id === prev
              ? { ...p, status: p.output ? 'review' as const : 'ready' as const }
              : p
          ),
        }
      })
      return null
    })
    setError(null)
  }

  function updateWorkflowInput(input: WorkflowInput) {
    setWorkflow(prev => prev ? { ...prev, input } : prev)
  }

  const generatePhase = useCallback(async (phaseId: PhaseId, feedback?: string, onNeedAuth?: () => void) => {
    if (!workflow) return
    const headers = getHeaders()
    if (!headers['x-access-code']) { onNeedAuth?.(); return }

    // Cancel any in-flight request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setIsGenerating(true)
    setGeneratingPhaseId(phaseId)
    setError(null)

    setWorkflow(prev => {
      if (!prev) return prev
      return {
        ...prev,
        phases: prev.phases.map(p =>
          p.id === phaseId ? { ...p, status: 'generating' as const, humanFeedback: feedback } : p
        ),
      }
    })

    try {
      const approvedPhases = workflow.phases
        .filter(p => p.status === 'approved' && p.output)
        .map(p => ({ id: p.id, name: p.name, output: p.output! }))

      const res = await fetch('/api/phase/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify({ phaseId, workflowInput: workflow.input, previousPhases: approvedPhases, humanFeedback: feedback }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Generation failed' }))
        throw new Error(err.error ?? 'Generation failed')
      }

      const output: PhaseOutput = await res.json()

      setWorkflow(prev => {
        if (!prev) return prev
        return {
          ...prev,
          phases: prev.phases.map(p =>
            p.id === phaseId
              ? { ...p, status: 'review' as const, output, generatedAt: new Date().toISOString(), revisionsCount: p.revisionsCount + (feedback ? 1 : 0) }
              : p
          ),
        }
      })
    } catch (err: unknown) {
      // Ignore abort errors — cancelGeneration() handles the state revert
      if (err instanceof Error && err.name === 'AbortError') return
      const msg = err instanceof Error ? err.message : 'Generation failed'
      setError(msg)
      setWorkflow(prev => {
        if (!prev) return prev
        return {
          ...prev,
          phases: prev.phases.map(p =>
            p.id === phaseId ? { ...p, status: p.output ? 'review' : 'ready' as const } : p
          ),
        }
      })
    } finally {
      if (abortRef.current && !abortRef.current.signal.aborted) {
        abortRef.current = null
        setIsGenerating(false)
        setGeneratingPhaseId(null)
      }
    }
  }, [workflow])

  function approvePhase(phaseId: PhaseId) {
    setWorkflow(prev => {
      if (!prev) return prev
      const phaseIndex = prev.phases.findIndex(p => p.id === phaseId)
      const updatedPhases = prev.phases.map((p, i) => {
        if (p.id === phaseId) return { ...p, status: 'approved' as const, approvedAt: new Date().toISOString() }
        if (i === phaseIndex + 1) return { ...p, status: 'ready' as const }
        return p
      })
      const nextPhase = updatedPhases[Math.min(phaseIndex + 1, updatedPhases.length - 1)]
      const allApproved = updatedPhases.every(p => p.status === 'approved')
      // Auto-navigate to next phase on approval
      setViewingPhaseId(nextPhase.id)
      return {
        ...prev,
        phases: updatedPhases,
        currentPhaseIndex: Math.min(phaseIndex + 1, updatedPhases.length - 1),
        completedAt: allApproved ? new Date().toISOString() : undefined,
      }
    })
  }

  function rejectPhase(phaseId: PhaseId, feedback: string, onNeedAuth?: () => void) {
    setWorkflow(prev => {
      if (!prev) return prev
      return {
        ...prev,
        phases: prev.phases.map(p =>
          p.id === phaseId ? { ...p, humanFeedback: feedback } : p
        ),
      }
    })
    generatePhase(phaseId, feedback, onNeedAuth)
  }

  function updateSectionContent(phaseId: PhaseId, sectionId: string, content: string) {
    setWorkflow(prev => {
      if (!prev) return prev
      return {
        ...prev,
        phases: prev.phases.map(p =>
          p.id === phaseId && p.output
            ? { ...p, output: { ...p.output, sections: p.output.sections.map(s => s.id === sectionId ? { ...s, content } : s) } }
            : p
        ),
      }
    })
  }

  function resetWorkflow() {
    setWorkflow(null)
    setViewingPhaseId(null)
    setError(null)
  }

  return (
    <WorkflowContext.Provider value={{
      workflow, viewingPhaseId, setViewingPhaseId,
      startWorkflow, generatePhase, cancelGeneration, approvePhase, rejectPhase,
      updateSectionContent, updateWorkflowInput, resetWorkflow, isGenerating, generatingPhaseId, error,
    }}>
      {children}
    </WorkflowContext.Provider>
  )
}

export function useWorkflow() {
  const ctx = useContext(WorkflowContext)
  if (!ctx) throw new Error('useWorkflow must be used within WorkflowProvider')
  return ctx
}
