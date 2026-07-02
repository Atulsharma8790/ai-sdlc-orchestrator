export const PORTFOLIO_URL =
  process.env.NEXT_PUBLIC_PORTFOLIO_URL ?? 'https://atulsharma.vercel.app'

import type { WorkflowPhase, WorkflowType, UserRole, PhaseId } from './types'

export const WORKFLOW_TYPE_LABELS: Record<WorkflowType, string> = {
  'agile-sprint':       'Agile Sprint Feature',
  'hotfix':             'Hotfix / Emergency Fix',
  'bug-fix':            'Bug Fix',
  'epic':               'Epic / Large Initiative',
  'compliance-release': 'Compliance / Regulated Release',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  'pm':               'Product Manager',
  'dev':              'Developer / Engineer',
  'qa':               'QA / Test Engineer',
  'devops':           'DevOps / SRE',
  'release-manager':  'Release Manager',
  'full-team':        'Full Team View',
}

export const PHASE_DEFINITIONS: Omit<WorkflowPhase, 'status' | 'revisionsCount'>[] = [
  {
    id: 'planning',
    name: 'Planning & Requirements',
    shortName: 'Planning',
    icon: '📋',
    description: 'User stories, acceptance criteria, story points, dependencies, sprint goal',
    relevantRoles: ['pm', 'dev', 'qa', 'full-team'],
    output: undefined,
  },
  {
    id: 'design',
    name: 'Design & Architecture',
    shortName: 'Design',
    icon: '🏗',
    description: 'API contracts, NFRs, security threat model, ADRs, performance SLAs',
    relevantRoles: ['dev', 'devops', 'full-team'],
    output: undefined,
  },
  {
    id: 'development',
    name: 'Development',
    shortName: 'Dev',
    icon: '💻',
    description: 'Definition of Done, code review checklist, PR templates, unit test scaffold',
    relevantRoles: ['dev', 'qa', 'full-team'],
    output: undefined,
  },
  {
    id: 'testing',
    name: 'Testing & QA',
    shortName: 'Testing',
    icon: '🧪',
    description: 'Test strategy, test cases, risk assessment, test data, exploratory charters',
    relevantRoles: ['qa', 'dev', 'full-team'],
    output: undefined,
  },
  {
    id: 'cicd',
    name: 'CI/CD & DevOps',
    shortName: 'CI/CD',
    icon: '⚙️',
    description: 'Release checklist, deployment runbook, rollback plan, feature flags',
    relevantRoles: ['devops', 'dev', 'full-team'],
    output: undefined,
  },
  {
    id: 'release',
    name: 'Release Management',
    shortName: 'Release',
    icon: '🚀',
    description: 'Go/No-Go criteria, release notes, stakeholder comms, compliance checklist',
    relevantRoles: ['release-manager', 'pm', 'full-team'],
    output: undefined,
  },
  {
    id: 'postrelease',
    name: 'Post-Release & Retro',
    shortName: 'Post-Release',
    icon: '📊',
    description: 'Sprint retro, lessons learned, post-mortem template, action items, OKR alignment',
    relevantRoles: ['pm', 'qa', 'dev', 'full-team'],
    output: undefined,
  },
]
