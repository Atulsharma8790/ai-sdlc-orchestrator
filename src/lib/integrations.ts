import type { PhaseId } from './types'

// ─── Config types ──────────────────────────────────────────────────────────────

export interface JiraConfig {
  siteUrl: string       // e.g. https://yourorg.atlassian.net
  email: string
  apiToken: string
  projectKey: string
  epicIssueType: string   // default 'Epic'
  storyIssueType: string  // default 'Story'
  taskIssueType: string   // default 'Task'
}

export interface ConfluenceConfig {
  siteUrl: string       // same domain as Jira usually
  email: string
  apiToken: string      // same token as Jira if same Atlassian account
  spaceKey: string
  parentPageId?: string // optional parent page
}

export interface GitHubConfig {
  token: string         // personal access token or fine-grained PAT
  owner: string         // org or username
  repo: string
  defaultBranch: string // default 'main'
}

export interface SlackConfig {
  webhookUrl: string    // Incoming Webhook URL
}

export interface IntegrationsConfig {
  jira?: Partial<JiraConfig>
  confluence?: Partial<ConfluenceConfig>
  github?: Partial<GitHubConfig>
  slack?: Partial<SlackConfig>
}

// ─── Action types ──────────────────────────────────────────────────────────────

export type IntegrationAction =
  | 'jira-create-stories'
  | 'jira-create-test-tickets'
  | 'jira-create-action-items'
  | 'confluence-publish'
  | 'github-create-issues'
  | 'github-create-pr'
  | 'github-push-file'
  | 'slack-post'

export interface ActionResult {
  ok: boolean
  message: string
  url?: string
}

// ─── Phase → available actions mapping ────────────────────────────────────────

export const PHASE_ACTIONS: Record<PhaseId, IntegrationAction[]> = {
  planning:    ['jira-create-stories', 'github-create-issues', 'confluence-publish', 'slack-post'],
  design:      ['confluence-publish', 'github-push-file', 'slack-post'],
  development: ['github-create-pr', 'github-push-file', 'confluence-publish', 'slack-post'],
  testing:     ['jira-create-test-tickets', 'github-create-issues', 'confluence-publish', 'slack-post'],
  cicd:        ['github-push-file', 'confluence-publish', 'slack-post'],
  release:     ['confluence-publish', 'slack-post', 'github-push-file'],
  postrelease: ['jira-create-action-items', 'confluence-publish', 'slack-post'],
}

export const ACTION_LABELS: Record<IntegrationAction, { label: string; icon: string; provider: string }> = {
  'jira-create-stories':      { label: 'Create Stories in Jira',        icon: '🎯', provider: 'jira' },
  'jira-create-test-tickets': { label: 'Create Test Tickets in Jira',   icon: '🧪', provider: 'jira' },
  'jira-create-action-items': { label: 'Create Action Items in Jira',   icon: '✅', provider: 'jira' },
  'confluence-publish':       { label: 'Publish to Confluence',          icon: '📄', provider: 'confluence' },
  'github-create-issues':     { label: 'Create GitHub Issues',           icon: '🐙', provider: 'github' },
  'github-create-pr':         { label: 'Create GitHub PR',               icon: '🔀', provider: 'github' },
  'github-push-file':         { label: 'Push as File to GitHub',         icon: '📁', provider: 'github' },
  'slack-post':               { label: 'Post to Slack',                  icon: '💬', provider: 'slack' },
}

// ─── Which provider each action needs ─────────────────────────────────────────

export function requiredProvider(action: IntegrationAction): keyof IntegrationsConfig {
  return ACTION_LABELS[action].provider as keyof IntegrationsConfig
}

// ─── Validation ───────────────────────────────────────────────────────────────

export function isJiraConfigured(c?: Partial<JiraConfig>): c is JiraConfig {
  return !!(c?.siteUrl && c.email && c.apiToken && c.projectKey)
}
export function isConfluenceConfigured(c?: Partial<ConfluenceConfig>): c is ConfluenceConfig {
  return !!(c?.siteUrl && c.email && c.apiToken && c.spaceKey)
}
export function isGitHubConfigured(c?: Partial<GitHubConfig>): c is GitHubConfig {
  return !!(c?.token && c.owner && c.repo)
}
export function isSlackConfigured(c?: Partial<SlackConfig>): c is SlackConfig {
  return !!(c?.webhookUrl)
}

export function isActionConfigured(action: IntegrationAction, cfg: IntegrationsConfig): boolean {
  switch (requiredProvider(action)) {
    case 'jira':        return isJiraConfigured(cfg.jira)
    case 'confluence':  return isConfluenceConfigured(cfg.confluence)
    case 'github':      return isGitHubConfigured(cfg.github)
    case 'slack':       return isSlackConfigured(cfg.slack)
    default:            return false
  }
}
