'use client'
import { Sun, Moon, ExternalLink, RotateCcw, Lock, Unlock, Plug } from 'lucide-react'
import { useTheme } from '@/context/theme'
import { useAuth } from '@/context/auth'
import { useWorkflow } from '@/context/workflow'
import { useIntegrations } from '@/context/integrations'
import { isJiraConfigured, isConfluenceConfigured, isGitHubConfigured, isSlackConfigured } from '@/lib/integrations'
import { PORTFOLIO_URL } from '@/lib/config'

interface Props {
  onDisclaimer: () => void
  onShowPasscode: () => void
  onIntegrations: () => void
}

export default function Header({ onDisclaimer, onShowPasscode, onIntegrations }: Props) {
  const { theme, toggle } = useTheme()
  const { isUnlocked, lock } = useAuth()
  const { workflow, resetWorkflow, cancelGeneration, isGenerating } = useWorkflow()

  function handleLock() {
    if (isGenerating) cancelGeneration()
    lock()
    resetWorkflow()
  }
  const { config } = useIntegrations()

  const configuredCount = [
    isJiraConfigured(config.jira),
    isConfluenceConfigured(config.confluence),
    isGitHubConfigured(config.github),
    isSlackConfigured(config.slack),
  ].filter(Boolean).length

  const noneConfigured = configuredCount === 0

  return (
    <header style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-default)' }} className="sticky top-0 z-40">
      <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center gap-2">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-auto">
          <span className="text-xl font-black"
            style={{ background: 'var(--accent-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ⚡ SDLC Orchestrator
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)' }}>
            AI
          </span>
        </div>

        <div className="flex items-center gap-2">
          {workflow && (
            <button onClick={resetWorkflow}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>
              <RotateCcw size={13} /> New Workflow
            </button>
          )}

          {/* Integrations — prominent, with badge */}
          <button onClick={onIntegrations}
            className="relative flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
            style={noneConfigured ? {
              background: 'rgba(59,130,246,0.12)',
              color: 'var(--accent-blue)',
              border: '1px solid rgba(59,130,246,0.4)',
              boxShadow: '0 0 12px rgba(59,130,246,0.15)',
            } : {
              background: 'rgba(16,185,129,0.1)',
              color: '#6EE7B7',
              border: '1px solid rgba(16,185,129,0.3)',
            }}>
            <Plug size={13} />
            Integrations
            {noneConfigured ? (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: 'var(--accent-blue)', color: 'white' }}>
                SET UP
              </span>
            ) : (
              <span className="text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold"
                style={{ background: '#10B981', color: 'white' }}>
                {configuredCount}
              </span>
            )}
          </button>

          <button onClick={onDisclaimer}
            className="text-xs px-3 py-1.5 rounded-lg font-medium"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>
            Disclaimer
          </button>

          <a href={PORTFOLIO_URL} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>
            Portfolio <ExternalLink size={11} />
          </a>

          {isUnlocked ? (
            <button onClick={handleLock}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold"
              style={{ background: 'rgba(16,185,129,0.1)', color: '#6EE7B7', border: '1px solid rgba(16,185,129,0.25)' }}
              title="Click to lock">
              <Unlock size={13} /> Unlocked
            </button>
          ) : (
            <button onClick={onShowPasscode}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.25)' }}
              title="Enter passcode to unlock">
              <Lock size={13} /> Locked
            </button>
          )}

          <button onClick={toggle}
            className="p-2 rounded-lg"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}
            aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </div>
    </header>
  )
}
