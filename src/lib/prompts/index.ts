import type { PhaseId, WorkflowInput, PhaseOutput, PhaseId as PID } from '../types'

// ─── System prompt ─────────────────────────────────────────────────────────────

export function buildSystemPrompt(): string {
  return `You are an elite Software Development Lifecycle (SDLC) expert and AI Orchestrator with 20+ years of experience across product management, software architecture, full-stack engineering, quality engineering, DevOps, release management, and agile coaching.

You help teams navigate every phase of the SDLC with precision — from initial requirements through post-release retrospectives. You generate comprehensive, production-grade artifacts tailored to the specific workflow type, team role, and technical context provided.

Your outputs must be:
- Concrete and specific, not generic boilerplate
- Directly derived from the inputs provided
- Structured with clear hierarchy and actionable items
- Calibrated to the workflow type (hotfix is terse and urgent; epic is expansive; compliance release is rigorous)
- Role-appropriate in depth and framing

OUTPUT RULES:
- Respond ONLY with valid JSON matching the exact schema requested
- No markdown fences, no text outside JSON
- Content fields use plain text with markdown formatting (headers ##, bullets -, bold **, code blocks \`\`\`)
- Confidence score reflects how much usable information was in the input (100 = full spec; 40 = vague idea)
- Be honest in keyAssumptions when you fill gaps`
}

// ─── Phase section definitions ─────────────────────────────────────────────────

const PHASE_SECTIONS: Record<PhaseId, { id: string; title: string; icon: string }[]> = {
  planning: [
    { id: 'stories',      title: 'User Stories & Epic Breakdown',     icon: '📖' },
    { id: 'criteria',     title: 'Acceptance Criteria',                icon: '✅' },
    { id: 'estimation',   title: 'Story Points & Effort Estimation',   icon: '📊' },
    { id: 'dependencies', title: 'Dependencies & Risk Radar',          icon: '🔗' },
    { id: 'sprintgoal',   title: 'Sprint Goal & Stakeholder Impact',   icon: '🎯' },
  ],
  design: [
    { id: 'api',          title: 'API Design & Contracts (OpenAPI)',   icon: '🔌' },
    { id: 'nfr',          title: 'Non-Functional Requirements',        icon: '⚡' },
    { id: 'security',     title: 'Security Threat Model (STRIDE)',     icon: '🔐' },
    { id: 'adr',          title: 'Architecture Decision Records',      icon: '🏛' },
    { id: 'performance',  title: 'Performance SLAs & Data Flow',       icon: '📈' },
  ],
  development: [
    { id: 'dod',          title: 'Definition of Done (per Story)',     icon: '☑️' },
    { id: 'codereview',   title: 'Code Review Checklist',              icon: '👁' },
    { id: 'pr',           title: 'PR Description Templates',           icon: '🔀' },
    { id: 'unittest',     title: 'Unit Test Scaffolding Plan',         icon: '🧩' },
    { id: 'techdebt',     title: 'Technical Debt & Refactoring Notes', icon: '🔧' },
  ],
  testing: [
    { id: 'strategy',     title: 'Test Strategy & Approach',          icon: '🗺' },
    { id: 'testcases',    title: 'Test Cases (BDD + Plain English)',   icon: '📝' },
    { id: 'risk',         title: 'Risk Assessment & Prioritisation',  icon: '⚠️' },
    { id: 'testdata',     title: 'Test Data Requirements',             icon: '🗃' },
    { id: 'exploratory',  title: 'Exploratory Testing Charters',      icon: '🔍' },
  ],
  cicd: [
    { id: 'checklist',    title: 'Release Checklist',                  icon: '✔️' },
    { id: 'runbook',      title: 'Deployment Runbook',                 icon: '📔' },
    { id: 'rollback',     title: 'Rollback Plan',                      icon: '↩️' },
    { id: 'featureflags', title: 'Feature Flags & Post-Deploy Checks', icon: '🚩' },
    { id: 'impact',       title: 'Change Impact & Environment Config', icon: '🌐' },
  ],
  release: [
    { id: 'gonogo',       title: 'Go/No-Go Criteria',                  icon: '🟢' },
    { id: 'releasenotes', title: 'Release Notes & Changelog',          icon: '📄' },
    { id: 'comms',        title: 'Stakeholder Communications',         icon: '📢' },
    { id: 'compliance',   title: 'Compliance Checklist (GDPR/SOC2)',   icon: '⚖️' },
    { id: 'riskregister', title: 'Hotfix Protocol & Risk Register',    icon: '🛡' },
  ],
  postrelease: [
    { id: 'retro',        title: 'Sprint Retrospective',               icon: '🔄' },
    { id: 'lessons',      title: 'Lessons Learned',                    icon: '💡' },
    { id: 'postmortem',   title: 'Incident Post-Mortem Template',      icon: '🩺' },
    { id: 'actions',      title: 'Action Items & OKR Alignment',       icon: '🎯' },
    { id: 'health',       title: 'Process Health & Next Cycle',        icon: '📊' },
  ],
}

// ─── Phase-specific instructions ───────────────────────────────────────────────

const PHASE_INSTRUCTIONS: Record<PhaseId, string> = {
  planning: `Generate comprehensive planning artifacts:
- stories: Write 3-8 user stories in "As a [role], I want [goal], so that [benefit]" format. Break epics into sub-stories. Include story IDs (US-001, US-002...).
- criteria: For each user story, write 3-5 concrete, testable acceptance criteria in Given/When/Then or bullet format.
- estimation: Assign Fibonacci story points (1,2,3,5,8,13) to each story with a rationale. Include total sprint capacity estimate and risk buffer recommendation.
- dependencies: List all technical, team, and external dependencies. Flag blockers and sequencing constraints. Include a risk radar with likelihood × impact for each.
- sprintgoal: Write a crisp sprint goal (1-2 sentences). Include stakeholder impact analysis: who is affected, how, and what change management is needed.`,

  design: `Generate design and architecture artifacts:
- api: Draft API contracts for all endpoints implied by the requirements. Include method, path, request/response schema, status codes, and auth requirements. Use OpenAPI-style format.
- nfr: Define non-functional requirements across: Performance (response times, throughput), Scalability, Availability/SLA, Security, Maintainability, Observability. Each with measurable targets.
- security: Apply STRIDE threat model (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege). For each relevant threat: describe, rate risk (High/Medium/Low), and provide mitigation.
- adr: Write Architecture Decision Records for 2-4 key design decisions. Format: Title, Status, Context, Decision, Consequences.
- performance: Define performance SLAs (p50/p95/p99 latencies, throughput targets). Describe data flow with key components and data transformation points.`,

  development: `Generate development-phase artifacts:
- dod: Write a Definition of Done checklist for each user story. Include: code complete, unit tests written, PR reviewed, security checked, docs updated, acceptance criteria verified, performance benchmarked.
- codereview: Create a comprehensive code review checklist covering: correctness, security (OWASP), performance, test coverage, naming/readability, error handling, logging, backward compatibility.
- pr: Write PR description templates for this type of change. Include: What changed, Why, How to test, Screenshots/evidence section, Checklist, Related tickets.
- unittest: Define the unit test scaffolding plan. List which components/functions need unit tests, what mocking strategy to use, coverage targets, and example test structure for key scenarios.
- techdebt: Identify potential technical debt this change might introduce or areas to watch. Include refactoring notes, code smell risks, and dependency version recommendations.`,

  testing: `Generate comprehensive testing artifacts:
- strategy: Write a full test strategy covering: scope (in/out of scope), test types (functional, regression, integration, performance, security, UAT), environments, entry/exit criteria, risk-based prioritisation approach, tools, and sign-off process.
- testcases: Write 8-15 test cases. Mix BDD Gherkin scenarios (Given/When/Then) for key flows AND plain-English cases for edge cases. Include positive, negative, boundary, and error scenarios. Format each with ID, title, preconditions, steps, expected result, priority.
- risk: Assess testing risks: areas most likely to have defects, areas most critical if they fail. Create risk matrix (likelihood × impact). Define mitigation strategy per risk.
- testdata: Define test data requirements: what data is needed, how to create/manage it, data masking for sensitive fields, environment-specific considerations, cleanup strategy.
- exploratory: Write 3-5 exploratory testing charters in format: "Explore [area] with [data/tools] to discover [risks/issues]". Include time-box and key questions to investigate.`,

  cicd: `Generate CI/CD and DevOps artifacts:
- checklist: Write a comprehensive pre-release checklist: all automated tests passing, code coverage met, security scan clean, performance baselines met, DB migrations verified, feature flags configured, monitoring alerts set up, rollback tested.
- runbook: Write step-by-step deployment runbook. Include: pre-deployment steps, deployment commands/steps, verification steps after each stage, expected outputs, who to notify at each stage.
- rollback: Define the rollback plan: trigger criteria (what metrics/errors indicate rollback needed), rollback steps (commands and order), data rollback strategy if DB migrations involved, communication template, post-rollback verification.
- featureflags: Define feature flag strategy: which features need flags, flag naming convention, gradual rollout plan (1% → 10% → 50% → 100%), kill switch criteria, post-deploy smoke test checklist.
- impact: Assess change impact: which services/components are affected, environment configuration changes needed, third-party integrations to verify, downstream system notifications, infrastructure scaling requirements.`,

  release: `Generate release management artifacts:
- gonogo: Define Go/No-Go criteria. List explicit conditions that MUST be true to proceed (Go criteria) and conditions that BLOCK release (No-Go criteria). Include: test pass thresholds, open P1/P2 defect limits, performance SLA verification, security sign-off, stakeholder approval sign-off sheet.
- releasenotes: Write complete release notes. Include: version number placeholder, release date, summary, new features (user-facing), bug fixes, known issues, upgrade instructions, breaking changes warning, deprecations.
- comms: Draft stakeholder communication plan. Write: internal announcement (engineering/product team), customer-facing announcement if applicable, support team briefing, executive summary. Include timing, channel (email/Slack/portal), and owner for each.
- compliance: Generate compliance checklist relevant to the workflow type. Cover: GDPR (data processing, consent, retention), SOC 2 (availability, security, confidentiality), accessibility (WCAG), audit logging, data encryption, third-party vendor review.
- riskregister: Build a risk register with top 5-7 risks for this release. For each: risk description, category, likelihood (H/M/L), impact (H/M/L), risk owner, mitigation, contingency. Include hotfix protocol: triggers, response time SLA, escalation path, and patch release process.`,

  postrelease: `Generate post-release and retrospective artifacts:
- retro: Facilitate a structured sprint retrospective. Format with: What went well (min 4 items), What didn't go well (min 4 items), What to try next sprint (min 3 actionable experiments), Team health pulse (energy/collaboration/quality sentiment), and Team appreciation section.
- lessons: Summarise lessons learned across all SDLC phases for this feature/release. Categorise by: Process, Technical, Communication, Testing, Estimation. Each lesson in format: Observation → Root Cause → Recommendation.
- postmortem: Create an incident post-mortem template pre-populated for this release context. Include: timeline template, impact summary, root cause analysis (5 Whys), contributing factors, action items with owners and due dates, and process improvements.
- actions: List concrete action items for the next cycle. Link to OKR framework: which team/company OKRs does each action support? Include owner, due date, success metric. Add velocity and predictability metrics summary.
- health: Score the process health for this SDLC cycle across: Requirements Clarity (0-10), Design Quality (0-10), Dev Velocity (0-10), Test Coverage (0-10), Deployment Confidence (0-10), Stakeholder Satisfaction (0-10). Overall health score. Recommendations for the next cycle.`,
}

// ─── Main prompt builder ────────────────────────────────────────────────────────

export function buildUserPrompt(
  phaseId: PhaseId,
  input: WorkflowInput,
  previousPhases: { id: PhaseId; name: string; output: PhaseOutput }[],
  humanFeedback?: string,
): string {
  const sections = PHASE_SECTIONS[phaseId]
  const instructions = PHASE_INSTRUCTIONS[phaseId]

  const prevContext = previousPhases.length > 0
    ? previousPhases.map(p =>
        `=== ${p.name.toUpperCase()} (APPROVED) ===\n` +
        p.output.sections.map(s => `--- ${s.title} ---\n${s.content}`).join('\n\n')
      ).join('\n\n')
    : 'No previous phases — this is the first phase.'

  const revisionNote = humanFeedback
    ? `\n\nHUMAN FEEDBACK TO ADDRESS IN THIS REVISION:\n"${humanFeedback}"\nIncorporate this feedback fully and note what changed in feedbackAddressed.`
    : ''

  return `Generate ${phaseId.toUpperCase()} phase artifacts for the following SDLC workflow.

WORKFLOW CONTEXT:
Title: ${input.title}
Type: ${input.workflowType}
Requesting Role: ${input.userRole}
${input.additionalContext ? `Additional Context: ${input.additionalContext}` : ''}

FEATURE / REQUIREMENT DESCRIPTION:
${input.description}

PREVIOUS APPROVED PHASES (use as context):
${prevContext}
${revisionNote}

INSTRUCTIONS FOR THIS PHASE:
${instructions}

Return a JSON object with EXACTLY this structure:
{
  "confidence": number (0-100 reflecting input completeness and clarity),
  "confidenceRationale": "1-2 sentences explaining why this confidence score",
  "keyAssumptions": ["assumption 1", "assumption 2", "..."],
  "feedbackAddressed": "what changed vs previous version, or null if first generation",
  "sections": [
    ${sections.map(s => `{
      "id": "${s.id}",
      "title": "${s.title}",
      "icon": "${s.icon}",
      "content": "rich markdown content for this section — be thorough and specific"
    }`).join(',\n    ')}
  ]
}`
}

export { PHASE_SECTIONS }
