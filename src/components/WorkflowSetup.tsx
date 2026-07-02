'use client'
import { useState } from 'react'
import { Play, Lightbulb } from 'lucide-react'
import { useWorkflow } from '@/context/workflow'
import { WORKFLOW_TYPE_LABELS, ROLE_LABELS } from '@/lib/config'
import type { WorkflowInput, WorkflowType, UserRole } from '@/lib/types'

const EXAMPLES: WorkflowInput[] = [
  {
    title: 'User Authentication with SSO & MFA',
    description: `Add Single Sign-On (SSO) via Google OAuth 2.0 and enforce Multi-Factor Authentication (MFA) for all admin accounts.

Currently, the app uses email/password auth only. We need to:
- Add "Sign in with Google" button on the login page
- Implement TOTP-based MFA (Google Authenticator compatible)
- Auto-prompt MFA enrollment for users with admin role
- Store MFA secrets encrypted at rest
- Audit log all auth events (login, logout, MFA enroll, MFA bypass)

Tech stack: Next.js 14, PostgreSQL, Prisma ORM, AWS Cognito as identity provider.
Team: 2 backend devs, 1 frontend dev, 1 QA engineer. 2-week sprint.`,
    workflowType: 'agile-sprint',
    userRole: 'full-team',
    additionalContext: 'Compliance requirement: SOC 2 Type II audit in 6 months. No downtime allowed during rollout.',
  },
]

export default function WorkflowSetup() {
  const { startWorkflow } = useWorkflow()
  const [form, setForm] = useState<WorkflowInput>({
    title: '',
    description: '',
    workflowType: 'agile-sprint',
    userRole: 'full-team',
    additionalContext: '',
  })

  function set<K extends keyof WorkflowInput>(key: K, val: WorkflowInput[K]) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function loadExample() { setForm(EXAMPLES[0]) }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.description.trim()) return
    startWorkflow(form)
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-start justify-center pt-16 px-4 pb-12">
      <div className="w-full max-w-2xl">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-5"
            style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--accent-blue)', border: '1px solid rgba(59,130,246,0.25)' }}>
            ⚡ 7 SDLC Phases · AI-Powered · Human-in-the-Loop
          </div>
          <h1 className="text-4xl font-black mb-3 leading-tight" style={{ color: 'var(--text-primary)' }}>
            AI SDLC{' '}
            <span style={{ background: 'var(--accent-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Orchestrator
            </span>
          </h1>
          <p className="text-base max-w-lg mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Describe your feature, bug, or epic. The AI generates comprehensive artifacts for every SDLC phase — from user stories to post-release retro — with your approval at each gate.
          </p>
        </div>

        {/* Phase pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {['📋 Planning','🏗 Design','💻 Dev','🧪 Testing','⚙️ CI/CD','🚀 Release','📊 Post-Release'].map(p => (
            <span key={p} className="text-xs px-3 py-1 rounded-full font-medium"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>
              {p}
            </span>
          ))}
        </div>

        {/* Form card */}
        <div className="rounded-2xl p-6 shadow-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                Feature / Story Title <span style={{ color: 'var(--accent-blue)' }}>*</span>
              </label>
              <input
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="e.g. User Authentication with SSO & MFA"
                className="input-themed"
                required
              />
            </div>

            {/* Workflow type + Role */}
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
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Your Role</label>
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
                Description & Requirements <span style={{ color: 'var(--accent-blue)' }}>*</span>
              </label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Describe the feature, bug, or epic in detail. Include: what needs to be built, why it's needed, any constraints, tech stack, acceptance conditions, business context..."
                rows={7}
                className="input-themed resize-y"
                required
              />
              <p className="mt-1 text-xs" style={{ color: 'var(--text-dimmer)' }}>
                More context = better artifacts. Include tech stack, team constraints, compliance requirements, etc.
              </p>
            </div>

            {/* Additional context */}
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                Additional Context <span style={{ color: 'var(--text-dimmer)' }}>(optional)</span>
              </label>
              <input
                value={form.additionalContext}
                onChange={e => set('additionalContext', e.target.value)}
                placeholder="Team size, sprint capacity, special constraints, compliance requirements..."
                className="input-themed"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={loadExample}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>
                <Lightbulb size={15} /> Load Example
              </button>
              <button type="submit" disabled={!form.title.trim() || !form.description.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-40"
                style={{ background: 'var(--accent-grad)' }}>
                <Play size={15} /> Start SDLC Orchestration
              </button>
            </div>
          </form>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-dimmer)' }}>
          Each phase requires your review and approval before the next phase begins. You can revise any phase at any time.
        </p>
      </div>
    </div>
  )
}
