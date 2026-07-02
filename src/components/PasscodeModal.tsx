'use client'
import { useState, useRef, useEffect } from 'react'
import { Lock, Unlock, X, ExternalLink, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/auth'
import { PORTFOLIO_URL } from '@/lib/config'

interface Props {
  onClose: () => void
  onUnlocked?: () => void
}

export default function PasscodeModal({ onClose, onUnlocked }: Props) {
  const { unlock } = useAuth()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    setError('')
    const result = await unlock(code.trim())
    setLoading(false)
    if (result.ok) {
      onUnlocked?.()
      onClose()
    } else {
      setError(result.error ?? 'Invalid passcode. Please try again.')
      setCode('')
      inputRef.current?.focus()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl shadow-2xl p-6"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg transition-all"
          style={{ color: 'var(--text-dimmer)' }}>
          <X size={16} />
        </button>

        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)' }}>
            <Lock size={24} style={{ color: 'var(--accent-blue)' }} />
          </div>
        </div>

        <h2 className="text-center text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Access Required</h2>
        <p className="text-center text-sm mb-6 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          This tool uses a private AI API. Enter the passcode to unlock SDLC generation.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              ref={inputRef}
              type="password"
              value={code}
              onChange={e => { setCode(e.target.value); setError('') }}
              placeholder="Enter passcode…"
              autoComplete="off"
              className="input-themed"
              style={{ borderColor: error ? '#EF4444' : undefined }}
            />
            {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
          </div>
          <button type="submit" disabled={!code.trim() || loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-40"
            style={{ background: 'var(--accent-grad)' }}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Unlock size={15} />}
            {loading ? 'Verifying…' : 'Unlock Orchestrator'}
          </button>
        </form>

        <div className="mt-5 pt-5 border-t" style={{ borderColor: 'var(--border-default)' }}>
          <p className="text-center text-xs" style={{ color: 'var(--text-dimmer)' }}>
            Don&apos;t have the passcode?{' '}
            <a href={`${PORTFOLIO_URL}#contact`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 font-medium underline underline-offset-2"
              style={{ color: 'var(--accent-blue)' }}>
              Request access <ExternalLink size={10} />
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
