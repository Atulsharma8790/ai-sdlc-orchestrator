'use client'
import { useState, useRef } from 'react'
import { Edit3, Check, X } from 'lucide-react'
import { useWorkflow } from '@/context/workflow'
import type { PhaseId, PhaseSection } from '@/lib/types'

interface Props { phaseId: PhaseId; section: PhaseSection }

function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, s => `<ul>${s}</ul>`)
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/```[\s\S]*?```/g, s => {
      const code = s.replace(/^```\w*\n?/, '').replace(/\n?```$/, '')
      return `<pre><code>${code.replace(/</g, '&lt;')}</code></pre>`
    })
    .replace(/^(?!<[hupol]|<li|<pre|<blockquote)(.+)$/gm, '<p>$1</p>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
}

export default function ArtifactSection({ phaseId, section }: Props) {
  const { updateSectionContent } = useWorkflow()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(section.content)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function startEdit() { setDraft(section.content); setEditing(true); setTimeout(() => textareaRef.current?.focus(), 50) }
  function save() { updateSectionContent(phaseId, section.id, draft); setEditing(false) }
  function cancel() { setDraft(section.content); setEditing(false) }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-default)' }}>
      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-2.5" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-default)' }}>
        <div className="flex items-center gap-2">
          <span className="text-base">{section.icon}</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{section.title}</span>
        </div>
        <div className="flex items-center gap-1">
          {editing ? (
            <>
              <button onClick={save} className="p-1.5 rounded-lg transition-colors" style={{ color: '#10B981', background: 'rgba(16,185,129,0.1)' }}><Check size={14} /></button>
              <button onClick={cancel} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-dimmer)', background: 'var(--bg-elevated)' }}><X size={14} /></button>
            </>
          ) : (
            <button onClick={startEdit} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-dimmer)', background: 'var(--bg-elevated)' }}
              title="Edit section"><Edit3 size={14} /></button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4" style={{ background: 'var(--bg-card)' }}>
        {editing ? (
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={16}
            className="w-full text-sm leading-relaxed outline-none resize-y rounded-lg p-3"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', fontFamily: 'monospace' }}
          />
        ) : (
          <div
            className="prose-section text-sm"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(section.content) }}
          />
        )}
      </div>
    </div>
  )
}
