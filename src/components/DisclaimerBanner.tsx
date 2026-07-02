'use client'
import { useState, useEffect } from 'react'
import { X, ShieldCheck } from 'lucide-react'

const SESSION_KEY = 'orchestrator_disclaimer_dismissed'

export default function DisclaimerBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!sessionStorage.getItem(SESSION_KEY)) setVisible(true)
  }, [])

  function dismiss() {
    sessionStorage.setItem(SESSION_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="w-full px-4 py-2.5 flex items-center gap-3 text-xs"
      style={{ background: 'rgba(59,130,246,0.08)', borderBottom: '1px solid rgba(59,130,246,0.2)' }}>
      <ShieldCheck size={14} className="shrink-0" style={{ color: '#93C5FD' }} />
      <p className="flex-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        <strong style={{ color: '#BFDBFE' }}>AI-generated artifacts — review before use:</strong>{' '}
        Workflow data is processed by{' '}
        <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer"
          className="underline" style={{ color: '#93C5FD' }}>
          Anthropic&apos;s Claude API
        </a>{' '}
        and is <strong>not stored</strong> on any server. Do not enter PII, trade secrets, or confidential data.
        All SDLC artifacts are AI suggestions — validate with your team before using in production.
      </p>
      <button onClick={dismiss} className="p-1 rounded shrink-0 transition-colors hover:bg-white/10"
        style={{ color: 'var(--text-dimmer)' }}>
        <X size={14} />
      </button>
    </div>
  )
}
