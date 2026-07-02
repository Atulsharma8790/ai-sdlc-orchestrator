'use client'
import { useState } from 'react'
import { Loader2, CheckCircle, XCircle, ExternalLink, Plug, ChevronRight, Zap } from 'lucide-react'
import { useIntegrations } from '@/context/integrations'
import { useAuth } from '@/context/auth'
import { PHASE_ACTIONS, ACTION_LABELS, isActionConfigured, isJiraConfigured, isConfluenceConfigured, isGitHubConfigured, isSlackConfigured } from '@/lib/integrations'
import type { PhaseId, PhaseOutput } from '@/lib/types'
import type { IntegrationAction, ActionResult } from '@/lib/integrations'

interface Props {
  phaseId: PhaseId
  phaseName: string
  workflowTitle: string
  output: PhaseOutput
  onOpenSettings: () => void
}

interface ActionState { loading: boolean; result: ActionResult | null }

const PROVIDER_META: Record<string, { bg: string; border: string; text: string; logo: string }> = {
  jira:       { bg: 'rgba(38,132,255,0.1)',   border: 'rgba(38,132,255,0.3)',   text: '#579DDB', logo: '🎯' },
  confluence: { bg: 'rgba(23,113,230,0.1)',   border: 'rgba(23,113,230,0.3)',   text: '#4C9AFF', logo: '📄' },
  github:     { bg: 'rgba(110,118,129,0.12)', border: 'rgba(110,118,129,0.3)', text: '#A0A0B0', logo: '🐙' },
  slack:      { bg: 'rgba(74,21,75,0.15)',    border: 'rgba(228,77,217,0.25)',  text: '#C77DCA', logo: '💬' },
}

// Provider config status chips
function ProviderStatus({ label, configured, logo }: { label: string; configured: boolean; logo: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs"
      style={{
        background: configured ? 'rgba(16,185,129,0.08)' : 'var(--bg-elevated)',
        border: `1px solid ${configured ? 'rgba(16,185,129,0.25)' : 'var(--border-default)'}`,
      }}>
      <span className="text-sm">{logo}</span>
      <span className="font-medium" style={{ color: configured ? '#6EE7B7' : 'var(--text-dimmer)' }}>{label}</span>
      <span className="text-[10px] font-bold" style={{ color: configured ? '#10B981' : 'var(--text-dimmer)' }}>
        {configured ? '✓' : '–'}
      </span>
    </div>
  )
}

export default function PhaseActions({ phaseId, phaseName, workflowTitle, output, onOpenSettings }: Props) {
  const { config } = useIntegrations()
  const { getHeaders } = useAuth()
  const [states, setStates] = useState<Partial<Record<IntegrationAction, ActionState>>>({})

  const availableActions = PHASE_ACTIONS[phaseId] ?? []
  const configuredActions = availableActions.filter(a => isActionConfigured(a, config))
  const unconfiguredActions = availableActions.filter(a => !isActionConfigured(a, config))
  const noneConfigured = configuredActions.length === 0

  async function runAction(action: IntegrationAction) {
    setStates(s => ({ ...s, [action]: { loading: true, result: null } }))
    try {
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify({
          action, phaseId, phaseName, workflowTitle,
          sections: output.sections,
          jira: config.jira, confluence: config.confluence,
          github: config.github, slack: config.slack,
        }),
      })
      const data: ActionResult & { error?: string } = await res.json()
      setStates(s => ({
        ...s,
        [action]: { loading: false, result: res.ok ? data : { ok: false, message: data.error ?? 'Action failed.' } },
      }))
    } catch (e) {
      setStates(s => ({
        ...s,
        [action]: { loading: false, result: { ok: false, message: (e as Error).message ?? 'Network error.' } },
      }))
    }
  }

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ border: '2px solid rgba(59,130,246,0.3)', background: 'var(--bg-card)' }}>

      {/* Header — always prominent */}
      <div className="px-5 py-4 flex items-start justify-between gap-4"
        style={{ background: 'rgba(59,130,246,0.06)', borderBottom: '1px solid rgba(59,130,246,0.2)' }}>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Zap size={15} className="shrink-0" style={{ color: 'var(--accent-blue)' }} />
            <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Push &amp; Integrate</span>
            {configuredActions.length > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)' }}>
                {configuredActions.length} action{configuredActions.length > 1 ? 's' : ''} ready
              </span>
            )}
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Push this phase's artifacts directly to your team's tools — no copy-paste.
          </p>
        </div>
        <button onClick={onOpenSettings}
          className="shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
          style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--accent-blue)', border: '1px solid rgba(59,130,246,0.3)' }}>
          <Plug size={12} /> {noneConfigured ? 'Connect Tools' : 'Settings'}
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Provider status bar */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-dimmer)' }}>
            Integration status
          </p>
          <div className="flex flex-wrap gap-2">
            <ProviderStatus label="Jira"        logo="🎯" configured={isJiraConfigured(config.jira)} />
            <ProviderStatus label="Confluence"  logo="📄" configured={isConfluenceConfigured(config.confluence)} />
            <ProviderStatus label="GitHub"      logo="🐙" configured={isGitHubConfigured(config.github)} />
            <ProviderStatus label="Slack"       logo="💬" configured={isSlackConfigured(config.slack)} />
          </div>
        </div>

        {/* CTA when nothing configured */}
        {noneConfigured && (
          <div className="rounded-xl p-4" style={{ background: 'rgba(59,130,246,0.05)', border: '1px dashed rgba(59,130,246,0.3)' }}>
            <p className="text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Connect your tools to take action
            </p>
            <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Stop copy-pasting. Connect Jira to auto-create stories, Confluence to publish docs, GitHub to open PRs or push files, and Slack to notify your team — all directly from here.
            </p>
            <div className="text-xs mb-4 space-y-1.5">
              {availableActions.map(a => (
                <div key={a} className="flex items-center gap-2" style={{ color: 'var(--text-dimmer)' }}>
                  <span>{ACTION_LABELS[a].icon}</span>
                  <span>{ACTION_LABELS[a].label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-dimmer)' }}>
                    {ACTION_LABELS[a].provider}
                  </span>
                </div>
              ))}
            </div>
            <button onClick={onOpenSettings}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white"
              style={{ background: 'var(--accent-grad)' }}>
              <Plug size={14} /> Set Up Integrations <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* Configured actions */}
        {configuredActions.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-dimmer)' }}>
              Ready to push
            </p>
            {configuredActions.map(action => {
              const meta = ACTION_LABELS[action]
              const pm = PROVIDER_META[meta.provider]
              const state = states[action]

              return (
                <div key={action}>
                  <button
                    onClick={() => runAction(action)}
                    disabled={state?.loading}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all hover:scale-[1.01] active:scale-100 disabled:opacity-60"
                    style={{ background: pm.bg, border: `1px solid ${pm.border}` }}>
                    <span className="text-lg shrink-0">{meta.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: pm.text }}>{meta.label}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-dimmer)' }}>via {meta.provider}</p>
                    </div>
                    {state?.loading
                      ? <Loader2 size={15} className="animate-spin shrink-0" style={{ color: pm.text }} />
                      : <ChevronRight size={15} className="shrink-0 opacity-50" style={{ color: pm.text }} />
                    }
                  </button>

                  {state?.result && (
                    <div className="mt-1.5 ml-2 flex items-start gap-2">
                      {state.result.ok
                        ? <CheckCircle size={13} className="mt-0.5 shrink-0 text-emerald-400" />
                        : <XCircle size={13} className="mt-0.5 shrink-0 text-red-400" />
                      }
                      <div>
                        <p className="text-xs leading-snug" style={{ color: state.result.ok ? '#6EE7B7' : '#FCA5A5' }}>
                          {state.result.message}
                        </p>
                        {state.result.url && (
                          <a href={state.result.url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] mt-0.5 font-medium underline underline-offset-2"
                            style={{ color: 'var(--accent-blue)' }}>
                            Open in {meta.provider} <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Unconfigured actions (when some are configured) */}
        {!noneConfigured && unconfiguredActions.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-dimmer)' }}>
              Also available after connecting
            </p>
            <div className="flex flex-wrap gap-1.5">
              {unconfiguredActions.map(action => (
                <button key={action} onClick={onOpenSettings}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-dimmer)', border: '1px solid var(--border-default)' }}>
                  {ACTION_LABELS[action].icon} {ACTION_LABELS[action].label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
