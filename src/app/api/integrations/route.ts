export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { verifyPasscode, unauthorizedResponse } from '@/lib/auth'
import type {
  IntegrationAction, JiraConfig, ConfluenceConfig, GitHubConfig, SlackConfig,
} from '@/lib/integrations'
import type { PhaseId } from '@/lib/types'

interface IntegrationRequest {
  action: IntegrationAction
  phaseId: PhaseId
  phaseName: string
  workflowTitle: string
  sections: { id: string; title: string; icon: string; content: string }[]
  jira?: JiraConfig
  confluence?: ConfluenceConfig
  github?: GitHubConfig
  slack?: SlackConfig
}

// ─── Markdown → Confluence wiki markup ────────────────────────────────────────
function mdToWiki(md: string): string {
  return md
    .replace(/^### (.+)$/gm, 'h4. $1')
    .replace(/^## (.+)$/gm, 'h3. $1')
    .replace(/^# (.+)$/gm, 'h2. $1')
    .replace(/\*\*(.+?)\*\*/g, '*$1*')
    .replace(/`([^`]+)`/g, '{{$1}}')
    .replace(/^- (.+)$/gm, '* $1')
    .replace(/^\d+\. (.+)$/gm, '# $1')
    .replace(/```[\s\S]*?```/g, (s) => {
      const code = s.replace(/^```\w*\n?/, '').replace(/\n?```$/, '')
      return `{code}${code}{code}`
    })
}

// ─── Extract user stories / issues from markdown ───────────────────────────────
function extractItems(content: string): { title: string; description: string }[] {
  const items: { title: string; description: string }[] = []
  const lines = content.split('\n')
  let current: { title: string; description: string } | null = null

  for (const line of lines) {
    // Match **US-001:**, **TC-001:**, **AI-001:**, **1.**, bullet "- **Title**:", etc.
    const storyMatch = line.match(/^\*\*(US|TC|AI|Story|Issue|Task|Item)-?\d*[:.]\*\*\s*(.+)/)
      ?? line.match(/^[-*]\s+\*\*([^*]+)\*\*:?\s*(.*)/)
      ?? line.match(/^\d+\.\s+\*\*([^*]+)\*\*:?\s*(.*)/)
    if (storyMatch) {
      if (current) items.push(current)
      current = { title: storyMatch[2]?.trim() || storyMatch[1]?.trim(), description: '' }
      continue
    }
    if (current && line.trim()) current.description += line + '\n'
    if (line.startsWith('##') && current) { items.push(current); current = null }
  }
  if (current) items.push(current)

  // Fallback: split by double newline blocks if nothing found
  if (items.length === 0) {
    const blocks = content.split(/\n{2,}/).filter(b => b.trim().length > 20).slice(0, 10)
    for (const block of blocks) {
      const firstLine = block.split('\n')[0].replace(/[*#`]/g, '').trim()
      items.push({ title: firstLine.slice(0, 80), description: block })
    }
  }

  return items.slice(0, 15)
}

// ─── Jira helpers ─────────────────────────────────────────────────────────────
async function jiraRequest(cfg: JiraConfig, path: string, body: unknown) {
  const auth = Buffer.from(`${cfg.email}:${cfg.apiToken}`).toString('base64')
  const url = `${cfg.siteUrl.replace(/\/$/, '')}/rest/api/3${path}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.errorMessages?.[0] ?? data.message ?? `Jira error ${res.status}`)
  return data
}

function jiraAdfText(text: string) {
  return {
    type: 'doc', version: 1,
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
  }
}

// ─── Confluence helpers ────────────────────────────────────────────────────────
async function confluenceRequest(cfg: ConfluenceConfig, path: string, body: unknown) {
  const auth = Buffer.from(`${cfg.email}:${cfg.apiToken}`).toString('base64')
  const url = `${cfg.siteUrl.replace(/\/$/, '')}/wiki/rest/api${path}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message ?? `Confluence error ${res.status}`)
  return data
}

// ─── GitHub helpers ────────────────────────────────────────────────────────────
async function githubRequest(cfg: GitHubConfig, path: string, method: string, body?: unknown) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${cfg.token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message ?? `GitHub error ${res.status}`)
  return data
}

// ─── Main handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (!verifyPasscode(req.headers.get('x-access-code'))) return unauthorizedResponse()

  let body: IntegrationRequest
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }

  const { action, phaseId, phaseName, workflowTitle, sections } = body
  const fullContent = sections.map(s => `## ${s.icon} ${s.title}\n\n${s.content}`).join('\n\n---\n\n')

  try {
    switch (action) {
      // ─── JIRA: Create Stories ──────────────────────────────────────────────
      case 'jira-create-stories':
      case 'jira-create-test-tickets':
      case 'jira-create-action-items': {
        const cfg = body.jira!
        const storiesSection = sections.find(s => s.id === 'stories' || s.id === 'testcases' || s.id === 'actions') ?? sections[0]
        const items = extractItems(storiesSection.content)
        if (items.length === 0) return NextResponse.json({ error: 'No items found to create in Jira.' }, { status: 400 })

        // Create Epic first
        const epicType = cfg.epicIssueType ?? 'Epic'
        const storyType = action === 'jira-create-test-tickets' ? (cfg.taskIssueType ?? 'Task') : (cfg.storyIssueType ?? 'Story')

        let epicKey: string | undefined
        try {
          const epic = await jiraRequest(cfg, '/issue', {
            fields: {
              project: { key: cfg.projectKey },
              issuetype: { name: epicType },
              summary: `[AI-SDLC] ${workflowTitle} — ${phaseName}`,
              description: jiraAdfText(`Generated by AI SDLC Orchestrator. Phase: ${phaseName}`),
            },
          })
          epicKey = epic.key
        } catch {
          // Epic creation failed (may not have Epic type) — create stories without parent
        }

        const created: string[] = []
        const errors: string[] = []

        for (const item of items.slice(0, 10)) {
          try {
            const fields: Record<string, unknown> = {
              project: { key: cfg.projectKey },
              issuetype: { name: storyType },
              summary: item.title.slice(0, 255),
              description: jiraAdfText(item.description.slice(0, 1000) || item.title),
            }
            if (epicKey) fields['parent'] = { key: epicKey }
            const issue = await jiraRequest(cfg, '/issue', { fields })
            created.push(issue.key)
          } catch (e) {
            errors.push((e as Error).message)
          }
        }

        const baseUrl = cfg.siteUrl.replace(/\/$/, '')
        return NextResponse.json({
          ok: created.length > 0,
          message: `Created ${created.length} issue(s) in Jira${epicKey ? ` under Epic ${epicKey}` : ''}${errors.length ? ` (${errors.length} failed)` : ''}.`,
          url: epicKey ? `${baseUrl}/browse/${epicKey}` : `${baseUrl}/jira/software/projects/${cfg.projectKey}/boards`,
          created,
          errors,
        })
      }

      // ─── CONFLUENCE: Publish Page ──────────────────────────────────────────
      case 'confluence-publish': {
        const cfg = body.confluence!
        const wikiBody = sections.map(s =>
          `h2. ${s.icon} ${s.title}\n\n${mdToWiki(s.content)}`
        ).join('\n\n----\n\n')

        const pageBody: Record<string, unknown> = {
          type: 'page',
          title: `[AI-SDLC] ${workflowTitle} — ${phaseName}`,
          space: { key: cfg.spaceKey },
          body: { wiki: { value: wikiBody, representation: 'wiki' } },
        }
        if (cfg.parentPageId) pageBody['ancestors'] = [{ id: cfg.parentPageId }]

        const page = await confluenceRequest(cfg, '/content', pageBody)
        const pageUrl = `${cfg.siteUrl.replace(/\/$/, '')}/wiki${page._links?.webui ?? `/spaces/${cfg.spaceKey}/pages/${page.id}`}`
        return NextResponse.json({ ok: true, message: `Page published to Confluence.`, url: pageUrl })
      }

      // ─── GITHUB: Create Issues ─────────────────────────────────────────────
      case 'github-create-issues': {
        const cfg = body.github!
        const storiesSection = sections.find(s => s.id === 'stories' || s.id === 'testcases') ?? sections[0]
        const items = extractItems(storiesSection.content)
        if (items.length === 0) return NextResponse.json({ error: 'No items found to create as GitHub Issues.' }, { status: 400 })

        const labelName = `ai-sdlc/${phaseId}`
        // Ensure label exists (ignore error if already exists)
        await githubRequest(cfg, `/repos/${cfg.owner}/${cfg.repo}/labels`, 'POST', {
          name: labelName, color: '3B82F6', description: `AI SDLC Orchestrator — ${phaseName}`,
        }).catch(() => {})

        const created: string[] = []
        for (const item of items.slice(0, 10)) {
          const issue = await githubRequest(cfg, `/repos/${cfg.owner}/${cfg.repo}/issues`, 'POST', {
            title: item.title.slice(0, 255),
            body: `> Generated by AI SDLC Orchestrator — ${workflowTitle}\n> Phase: ${phaseName}\n\n${item.description.slice(0, 2000)}`,
            labels: [labelName],
          })
          created.push(issue.html_url)
        }

        return NextResponse.json({
          ok: true,
          message: `Created ${created.length} issue(s) in GitHub.`,
          url: `https://github.com/${cfg.owner}/${cfg.repo}/issues?q=label:${encodeURIComponent(labelName)}`,
          created,
        })
      }

      // ─── GITHUB: Create PR ─────────────────────────────────────────────────
      case 'github-create-pr': {
        const cfg = body.github!
        const prSection = sections.find(s => s.id === 'pr') ?? sections[0]
        const branch = `ai-sdlc/${workflowTitle.toLowerCase().replace(/\s+/g, '-').slice(0, 40)}-${Date.now()}`
        const base = cfg.defaultBranch ?? 'main'

        // Get default branch SHA
        const branchData = await githubRequest(cfg, `/repos/${cfg.owner}/${cfg.repo}/git/refs/heads/${base}`, 'GET')
        const sha = branchData.object?.sha
        if (!sha) throw new Error(`Could not find branch '${base}' in repo.`)

        // Create feature branch
        await githubRequest(cfg, `/repos/${cfg.owner}/${cfg.repo}/git/refs`, 'POST', {
          ref: `refs/heads/${branch}`, sha,
        })

        // Create PR
        const pr = await githubRequest(cfg, `/repos/${cfg.owner}/${cfg.repo}/pulls`, 'POST', {
          title: `[AI-SDLC] ${workflowTitle}`,
          head: branch,
          base,
          body: `> Auto-generated by AI SDLC Orchestrator\n> Workflow: **${workflowTitle}**\n\n${prSection.content.slice(0, 4000)}`,
          draft: true,
        })

        return NextResponse.json({ ok: true, message: `Draft PR created in GitHub.`, url: pr.html_url })
      }

      // ─── GITHUB: Push File ─────────────────────────────────────────────────
      case 'github-push-file': {
        const cfg = body.github!
        const fileName = `sdlc-docs/${workflowTitle.toLowerCase().replace(/\s+/g, '-').slice(0, 40)}/${phaseId}.md`
        const fileContent = `# ${phaseName} — ${workflowTitle}\n\n> Generated by AI SDLC Orchestrator\n\n${fullContent}`
        const base64Content = Buffer.from(fileContent).toString('base64')
        const branch = cfg.defaultBranch ?? 'main'

        // Check if file exists (to get SHA for update)
        let existingSha: string | undefined
        try {
          const existing = await githubRequest(cfg, `/repos/${cfg.owner}/${cfg.repo}/contents/${fileName}`, 'GET')
          existingSha = existing.sha
        } catch {}

        const result = await githubRequest(cfg, `/repos/${cfg.owner}/${cfg.repo}/contents/${fileName}`, 'PUT', {
          message: `[AI-SDLC] ${existingSha ? 'Update' : 'Add'} ${phaseName} artifacts for: ${workflowTitle}`,
          content: base64Content,
          branch,
          ...(existingSha ? { sha: existingSha } : {}),
        })

        return NextResponse.json({
          ok: true,
          message: `File pushed to GitHub: ${fileName}`,
          url: result.content?.html_url ?? `https://github.com/${cfg.owner}/${cfg.repo}`,
        })
      }

      // ─── SLACK: Post ───────────────────────────────────────────────────────
      case 'slack-post': {
        const cfg = body.slack!
        const summary = sections[0]?.content?.slice(0, 300) ?? ''
        const payload = {
          blocks: [
            {
              type: 'header',
              text: { type: 'plain_text', text: `⚡ AI SDLC: ${phaseName} Approved`, emoji: true },
            },
            {
              type: 'section',
              fields: [
                { type: 'mrkdwn', text: `*Workflow:*\n${workflowTitle}` },
                { type: 'mrkdwn', text: `*Phase:*\n${phaseName}` },
              ],
            },
            {
              type: 'section',
              text: { type: 'mrkdwn', text: `*Summary:*\n${summary.replace(/[*#`]/g, '').slice(0, 300)}…` },
            },
            {
              type: 'section',
              text: { type: 'mrkdwn', text: `*Sections generated:* ${sections.map(s => `${s.icon} ${s.title}`).join(' · ')}` },
            },
            { type: 'divider' },
          ],
        }
        const res = await fetch(cfg.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error(`Slack returned ${res.status}`)
        return NextResponse.json({ ok: true, message: 'Posted to Slack successfully.' })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (err) {
    console.error('Integration error:', action, err)
    return NextResponse.json({ error: (err as Error).message ?? 'Integration failed.' }, { status: 500 })
  }
}
