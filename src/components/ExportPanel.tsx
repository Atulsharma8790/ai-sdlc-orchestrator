'use client'
import { Download, FileText } from 'lucide-react'
import { useWorkflow } from '@/context/workflow'
import { WORKFLOW_TYPE_LABELS, ROLE_LABELS } from '@/lib/config'

export default function ExportPanel() {
  const { workflow } = useWorkflow()
  if (!workflow) return null

  const approvedPhases = workflow.phases.filter(p => p.status === 'approved' && p.output)
  if (approvedPhases.length === 0) return null

  function exportMarkdown() {
    if (!workflow) return
    const lines: string[] = []
    lines.push(`# SDLC Package: ${workflow.input.title}`)
    lines.push(``)
    lines.push(`**Workflow Type:** ${WORKFLOW_TYPE_LABELS[workflow.input.workflowType]}`)
    lines.push(`**Role:** ${ROLE_LABELS[workflow.input.userRole]}`)
    lines.push(`**Generated:** ${new Date(workflow.startedAt).toLocaleString()}`)
    lines.push(``)
    lines.push(`---`)
    lines.push(``)
    lines.push(`## Feature Description`)
    lines.push(workflow.input.description)
    if (workflow.input.additionalContext) {
      lines.push(``)
      lines.push(`## Additional Context`)
      lines.push(workflow.input.additionalContext)
    }
    lines.push(``)

    for (const phase of approvedPhases) {
      if (!phase.output) continue
      lines.push(`---`)
      lines.push(``)
      lines.push(`# Phase: ${phase.icon} ${phase.name}`)
      lines.push(``)
      lines.push(`**AI Confidence:** ${phase.output.confidence}/100 — ${phase.output.confidenceRationale}`)
      if (phase.output.keyAssumptions.length > 0) {
        lines.push(``)
        lines.push(`**Key Assumptions:**`)
        phase.output.keyAssumptions.forEach(a => lines.push(`- ${a}`))
      }
      if (phase.revisionsCount > 0) lines.push(`**Revisions:** ${phase.revisionsCount}`)
      lines.push(``)

      for (const section of phase.output.sections) {
        lines.push(`## ${section.icon} ${section.title}`)
        lines.push(``)
        lines.push(section.content)
        lines.push(``)
      }
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sdlc-${workflow.input.title.toLowerCase().replace(/\s+/g, '-').slice(0, 40)}-${Date.now()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const allDone = workflow.phases.every(p => p.status === 'approved')

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
      <div className="flex items-center gap-2">
        <FileText size={15} style={{ color: 'var(--accent-blue)' }} />
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Export</span>
        {allDone && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}>Complete!</span>}
      </div>
      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
        {approvedPhases.length} of {workflow.phases.length} phases approved
      </p>
      <button onClick={exportMarkdown}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold text-white transition-opacity"
        style={{ background: 'var(--accent-grad)' }}>
        <Download size={14} /> Download Markdown
      </button>
    </div>
  )
}
