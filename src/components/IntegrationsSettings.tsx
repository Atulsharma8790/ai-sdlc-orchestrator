'use client'
import { useState } from 'react'
import { X, Save, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { useIntegrations } from '@/context/integrations'
import type { IntegrationsConfig } from '@/lib/integrations'

interface Props { onClose: () => void }

function Field({ label, value, onChange, placeholder, type = 'text', hint }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder: string; type?: string; hint?: string
}) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  return (
    <div>
      <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <div className="relative">
        <input
          type={isPassword && !show ? 'password' : 'text'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="input-themed text-xs"
          style={{ paddingRight: isPassword ? '2.5rem' : undefined }}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(s => !s)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-dimmer)' }}>
            {show ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        )}
      </div>
      {hint && <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-dimmer)' }}>{hint}</p>}
    </div>
  )
}

function SectionHeader({ emoji, name, configured }: { emoji: string; name: string; configured: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-lg">{emoji}</span>
      <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{name}</span>
      {configured
        ? <span className="ml-auto flex items-center gap-1 text-[10px] font-medium" style={{ color: '#10B981' }}><CheckCircle size={11} /> Configured</span>
        : <span className="ml-auto flex items-center gap-1 text-[10px] font-medium" style={{ color: 'var(--text-dimmer)' }}><AlertCircle size={11} /> Not set</span>
      }
    </div>
  )
}

export default function IntegrationsSettings({ onClose }: Props) {
  const { config, saveConfig } = useIntegrations()

  const [jira, setJira] = useState({ siteUrl: '', email: '', apiToken: '', projectKey: '', epicIssueType: 'Epic', storyIssueType: 'Story', taskIssueType: 'Task', ...config.jira })
  const [confluence, setConfluence] = useState({ siteUrl: '', email: '', apiToken: '', spaceKey: '', parentPageId: '', ...config.confluence })
  const [github, setGitHub] = useState({ token: '', owner: '', repo: '', defaultBranch: 'main', ...config.github })
  const [slack, setSlack] = useState({ webhookUrl: '', ...config.slack })
  const [saved, setSaved] = useState(false)

  function setJ(k: string, v: string) { setJira(p => ({ ...p, [k]: v })) }
  function setC(k: string, v: string) { setConfluence(p => ({ ...p, [k]: v })) }
  function setG(k: string, v: string) { setGitHub(p => ({ ...p, [k]: v })) }
  function setS(k: string, v: string) { setSlack(p => ({ ...p, [k]: v })) }

  function handleSave() {
    const cfg: IntegrationsConfig = {}
    if (jira.siteUrl || jira.apiToken) cfg.jira = jira
    if (confluence.siteUrl || confluence.apiToken) cfg.confluence = confluence
    if (github.token) cfg.github = github
    if (slack.webhookUrl) cfg.slack = slack
    saveConfig(cfg)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const jiraConfigured = !!(jira.siteUrl && jira.email && jira.apiToken && jira.projectKey)
  const confluenceConfigured = !!(confluence.siteUrl && confluence.email && confluence.apiToken && confluence.spaceKey)
  const githubConfigured = !!(github.token && github.owner && github.repo)
  const slackConfigured = !!(slack.webhookUrl)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md h-full max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl shadow-2xl flex flex-col"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b z-10"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
          <div>
            <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Integrations</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-dimmer)' }}>Credentials stored locally · never sent to our servers</p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-dimmer)' }}><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {/* Privacy note */}
          <div className="p-3 rounded-xl text-xs leading-relaxed" style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)', color: 'var(--text-secondary)' }}>
            🔐 <strong>Privacy:</strong> All credentials are saved in your browser's localStorage only. They are sent to the integration APIs (Jira, Confluence, GitHub, Slack) via our secure proxy when you trigger an action — they are never logged or stored server-side.
          </div>

          {/* Jira */}
          <div className="p-4 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
            <SectionHeader emoji="🎯" name="Jira" configured={jiraConfigured} />
            <div className="space-y-3">
              <Field label="Site URL" value={jira.siteUrl} onChange={v => setJ('siteUrl', v)} placeholder="https://yourorg.atlassian.net" hint="Your Atlassian domain" />
              <Field label="Email" value={jira.email} onChange={v => setJ('email', v)} placeholder="you@company.com" />
              <Field label="API Token" value={jira.apiToken} onChange={v => setJ('apiToken', v)} placeholder="ATATT3xF..." type="password" hint="Create at id.atlassian.com → API tokens" />
              <Field label="Project Key" value={jira.projectKey} onChange={v => setJ('projectKey', v)} placeholder="ENG" hint="The short key visible in your Jira project URL" />
              <div className="grid grid-cols-3 gap-2">
                <Field label="Epic Type" value={jira.epicIssueType} onChange={v => setJ('epicIssueType', v)} placeholder="Epic" />
                <Field label="Story Type" value={jira.storyIssueType} onChange={v => setJ('storyIssueType', v)} placeholder="Story" />
                <Field label="Task Type" value={jira.taskIssueType} onChange={v => setJ('taskIssueType', v)} placeholder="Task" />
              </div>
            </div>
          </div>

          {/* Confluence */}
          <div className="p-4 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
            <SectionHeader emoji="📄" name="Confluence" configured={confluenceConfigured} />
            <div className="space-y-3">
              <Field label="Site URL" value={confluence.siteUrl} onChange={v => setC('siteUrl', v)} placeholder="https://yourorg.atlassian.net" hint="Usually same as Jira" />
              <Field label="Email" value={confluence.email} onChange={v => setC('email', v)} placeholder="you@company.com" />
              <Field label="API Token" value={confluence.apiToken} onChange={v => setC('apiToken', v)} placeholder="ATATT3xF..." type="password" hint="Same token as Jira if same Atlassian account" />
              <Field label="Space Key" value={confluence.spaceKey} onChange={v => setC('spaceKey', v)} placeholder="ENG" hint="Found in Confluence Space Settings → Space Key" />
              <Field label="Parent Page ID (optional)" value={confluence.parentPageId ?? ''} onChange={v => setC('parentPageId', v)} placeholder="123456789" hint="ID from the parent page URL: /pages/123456789" />
            </div>
          </div>

          {/* GitHub */}
          <div className="p-4 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
            <SectionHeader emoji="🐙" name="GitHub" configured={githubConfigured} />
            <div className="space-y-3">
              <Field label="Personal Access Token" value={github.token} onChange={v => setG('token', v)} placeholder="ghp_..." type="password" hint="Settings → Developer Settings → Personal access tokens. Needs: repo, issues, pull_requests scopes" />
              <div className="grid grid-cols-2 gap-2">
                <Field label="Owner" value={github.owner} onChange={v => setG('owner', v)} placeholder="org-or-username" />
                <Field label="Repository" value={github.repo} onChange={v => setG('repo', v)} placeholder="my-repo" />
              </div>
              <Field label="Default Branch" value={github.defaultBranch} onChange={v => setG('defaultBranch', v)} placeholder="main" />
            </div>
          </div>

          {/* Slack */}
          <div className="p-4 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
            <SectionHeader emoji="💬" name="Slack" configured={slackConfigured} />
            <div className="space-y-3">
              <Field label="Incoming Webhook URL" value={slack.webhookUrl} onChange={v => setS('webhookUrl', v)} placeholder="https://hooks.slack.com/services/..." type="password" hint="Create at api.slack.com → Your Apps → Incoming Webhooks" />
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="sticky bottom-0 px-5 py-4 border-t" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
          <button onClick={handleSave} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white transition-all"
            style={{ background: saved ? 'linear-gradient(135deg,#10B981,#059669)' : 'var(--accent-grad)' }}>
            {saved ? <><CheckCircle size={15} /> Saved!</> : <><Save size={15} /> Save Integrations</>}
          </button>
        </div>
      </div>
    </div>
  )
}
