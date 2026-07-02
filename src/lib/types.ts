// ─── Workflow configuration ───────────────────────────────────────────────────

export type WorkflowType =
  | 'agile-sprint'
  | 'hotfix'
  | 'bug-fix'
  | 'epic'
  | 'compliance-release'

export type UserRole =
  | 'pm'
  | 'dev'
  | 'qa'
  | 'devops'
  | 'release-manager'
  | 'full-team'

export type PhaseId =
  | 'planning'
  | 'design'
  | 'development'
  | 'testing'
  | 'cicd'
  | 'release'
  | 'postrelease'

export type PhaseStatus =
  | 'locked'      // previous phase not yet approved
  | 'ready'       // can be generated
  | 'generating'  // AI call in progress
  | 'review'      // output ready, awaiting human
  | 'approved'    // human approved, next phase unlocked

// ─── Artifact sections ────────────────────────────────────────────────────────

export interface PhaseSection {
  id: string
  title: string
  icon: string
  content: string     // editable markdown/text
}

export interface PhaseOutput {
  confidence: number            // 0–100 AI confidence score
  confidenceRationale: string   // why this score
  sections: PhaseSection[]
  keyAssumptions: string[]
  feedbackAddressed?: string    // set on revision
}

// ─── Phase state ──────────────────────────────────────────────────────────────

export interface WorkflowPhase {
  id: PhaseId
  name: string
  shortName: string
  icon: string
  description: string
  relevantRoles: UserRole[]     // which roles care about this phase
  status: PhaseStatus
  output?: PhaseOutput
  humanFeedback?: string
  generatedAt?: string
  approvedAt?: string
  revisionsCount: number
}

// ─── Workflow input ───────────────────────────────────────────────────────────

export interface WorkflowInput {
  title: string
  description: string           // the main feature/epic/bug description
  workflowType: WorkflowType
  userRole: UserRole
  additionalContext?: string    // team size, tech stack, constraints
}

// ─── Full workflow state ──────────────────────────────────────────────────────

export interface WorkflowState {
  id: string
  input: WorkflowInput
  phases: WorkflowPhase[]
  currentPhaseIndex: number
  startedAt: string
  completedAt?: string
}

// ─── API types ────────────────────────────────────────────────────────────────

export interface GeneratePhaseRequest {
  phaseId: PhaseId
  workflowInput: WorkflowInput
  previousPhases: { id: PhaseId; name: string; output: PhaseOutput }[]
  humanFeedback?: string
}

export interface GeneratePhaseResponse extends PhaseOutput {}
