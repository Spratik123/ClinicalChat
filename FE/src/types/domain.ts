/**
 * Domain model for the Clinic Chat audit platform.
 *
 * Sources: BRD v2 section 10 (Data Requirements) and section 15 (Glossary),
 * plus the shapes used by the client prototype.
 *
 * Nothing in here describes the live SMS bot — this platform only ever *reads*
 * conversation data and *recommends* changes (BRD 6.4).
 */

/* ------------------------------------------------------------------ *
 * Primitives
 * ------------------------------------------------------------------ */

export type IsoDateTime = string;

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/* ------------------------------------------------------------------ *
 * People and access (BRD 5, 11)
 * ------------------------------------------------------------------ */

export type Role = 'owner_admin' | 'content_reviewer' | 'developer';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export type UserStatus = 'active' | 'pending' | 'deactivated';

export interface PlatformUser extends AuthUser {
  status: UserStatus;
  lastLoginAt: IsoDateTime | null;
}

export interface AccessLogEntry {
  id: string;
  at: IsoDateTime;
  actor: string;
  change: string;
}

/* ------------------------------------------------------------------ *
 * Flows and intents (BRD 3.1, 15)
 * ------------------------------------------------------------------ */

/**
 * Known flow_type values from BRD 3.1. Deliberately widened with `(string & {})`
 * so unknown and newly added flows (the `survey_*` family keeps growing) still
 * type-check — schema flexibility is a hard NFR (FR-DATA-001, OQ-03).
 */
export type FlowType =
  | 'stop'
  | 'escalation'
  | 'switch_language'
  | 'substantive_question'
  | 'greeting'
  | 'picklist_selection'
  | 'gratitude_feedback_or_ender'
  | 'other'
  | (string & {});

/** Priority tiers the production classifier assigns to flows (BRD 3.1). */
export type FlowPriority = 1 | 2 | 3;

export interface MatchedIntent {
  rank: number;
  name: string;
  confidence: number;
  /** Response text bound to this intent — the intent name does not always match the response given (BRD 3.2). */
  responseText?: string;
  /** True for the intent production actually selected. */
  selected: boolean;
  /** Audit verdict on whether this intent belongs at this rank (CC-P1-005). */
  rankingCorrect?: boolean;
}

export interface FlowAssessment {
  flowType: FlowType;
  subFlow: string;
  /** Audit verdict on classification (CC-P1-003 / FR-FLOW-001). */
  correct: boolean;
  expectedFlowType?: FlowType;
  expectedSubFlow?: string;
}

/**
 * Content library snapshot a finding was evaluated against. Without this a
 * finding cannot be reproduced once the library moves on — BRD 12 requires
 * findings be traceable to their source.
 */
export interface CatalogContext {
  libraryVersion: string;
  snapshotId: string;
  bestCatalogMatch?: string;
}

/* ------------------------------------------------------------------ *
 * Conversation turns (BRD 10)
 * ------------------------------------------------------------------ */

export type MessageDirection = 'inbound' | 'outbound' | 'scheduled';

export interface TranscriptMessage {
  id: string;
  direction: MessageDirection;
  /** Rendering side. `user` is the participant, `bot` is Clinic Chat. */
  who: 'user' | 'bot';
  text: string;
  at: IsoDateTime;
  contentType?: string;
  messageType?: string;
}

export interface PicklistOption {
  position: number;
  label: string;
  /** Underlying intent — the audit stores both what the user saw and what sat behind it (BRD 15). */
  intentName?: string;
  active: boolean;
}

export interface Picklist {
  presented: boolean;
  options: PicklistOption[];
  selectedPosition?: number;
  /** Audit verdict on picklist correctness (CC-P1-009). */
  selectionMatchedRequest?: boolean;
}

/** Survey interaction stage (BRD 15, CC-P1-010). */
export type SurveyStage =
  | 'survey_response'
  | 'invalid_response'
  | 'interruption'
  | 're_ask'
  | 'back'
  | 'correction'
  | 'override'
  | 'confirmation';

export interface SurveyState {
  surveyName: string;
  stage: SurveyStage;
  questionKey?: string;
  /** Audit verdict on how the stage transition was handled. */
  handledCorrectly?: boolean;
  notes?: string;
}

/** Uploaded document pulled into the audit path — gated by OQ-02 / OQ-08. */
export interface AuditedDocument {
  id: string;
  /** Never a raw S3 URL; a short-lived, access-logged reference. */
  assetRef: string;
  mimeType: string;
  /** OCR legibility assessment (CC-P1-011). */
  legibility: 'clear' | 'degraded' | 'unreadable';
  extractedValues: Record<string, JsonValue>;
  verificationRules: VerificationRuleOutcome[];
}

export interface VerificationRuleOutcome {
  rule: string;
  outcome: 'pass' | 'fail' | 'inconclusive';
  /** Audit verdict on the *rule logic*, not just the extraction (CC-P1-011). */
  ruleCorrect?: boolean;
  detail?: string;
}

export interface ConversationTurn {
  id: string;
  /** Pseudonymised participant reference. Raw phone numbers must never reach the client (BRD 11, OQ-02). */
  participantHash: string;
  occurredAt: IsoDateTime;
  transcript: TranscriptMessage[];
  flow: FlowAssessment;
  matchedIntents: MatchedIntent[];
  catalog: CatalogContext;
  picklist?: Picklist;
  survey?: SurveyState;
  documents?: AuditedDocument[];
  /**
   * Raw LangGraph execution trace, verbatim. Intentionally untyped: the trace
   * structure changes over time by design (FR-DATA-001, OQ-03), so it is
   * rendered by a generic viewer rather than mapped field-by-field.
   */
  rawTrace: JsonValue;
  findings: Finding[];
}

/* ------------------------------------------------------------------ *
 * Findings (BRD 9.1, CC-P1-004)
 * ------------------------------------------------------------------ */

/** The four canonical failure types from FR-ENG-002, plus the additional detectors. */
export type FindingType =
  | 'missing_content'
  | 'genuine_ai_miss'
  | 'stop_escalation_miss'
  | 'response_intent_mismatch'
  | 'intent_overlap'
  | 'semantic_mismatch'
  | 'picklist_mismatch'
  | 'survey_state_error'
  | 'document_extraction'
  | 'verification_rule_error'
  | 'prompt_gap'
  | 'flow_misroute';

/** Where a finding routes for action (CC-P1-019, OQ-05). */
export type FindingOwner = 'safety' | 'content' | 'engineering';

export type Severity = 'safety' | 'high' | 'medium' | 'low';

export type ReviewStatus = 'open' | 'approved' | 'changes_requested' | 'rejected' | 'routed';

export interface Finding {
  id: string;
  turnId: string;
  runId: string;
  type: FindingType;
  severity: Severity;
  owner: FindingOwner;
  title: string;
  summary: string;
  /** Machine-readable justification, shown verbatim in a mono block. */
  evidence: string;
  status: ReviewStatus;
  createdAt: IsoDateTime;
}

export interface OutputQualityScore {
  accuracy: number;
  relevance: number;
  groundedness: number;
  completeness: number;
  safetyCompliance: number;
  tone: number;
  /** The dimension the BRD singles out: did it answer the actual question (FR-OQS-001). */
  answersActualQuestion: boolean;
  weightedTotal: number;
}

/* ------------------------------------------------------------------ *
 * Review queue (CC-P1-017)
 * ------------------------------------------------------------------ */

export interface QueueItem {
  turnId: string;
  findingId: string;
  severity: Severity;
  /** True only for missed STOP opt-outs and missed emergency escalations. */
  safetyCritical: boolean;
  findingType: FindingType;
  findingLabel: string;
  flowType: FlowType;
  confidence: number;
  participantHash: string;
  status: ReviewStatus;
  createdAt: IsoDateTime;
  /** Explanation of why this ranks where it does (CC-P1-017 "Risk Explanation"). */
  priorityReason?: string;
  /**
   * 0-100 display score. Derived deterministically from severity + confidence
   * (`utils/risk.ts`) — not a separate model output. A real risk-scoring
   * engine (per CC-P1-017's "Risk Scoring Engine" line item) would replace
   * this derivation, not the field itself.
   */
  riskScore: number;
  /** The reviewer working this item, if any. Drives the Needs review / In review distinction. */
  assignee: string | null;
  /** A representative quote from the turn — the participant message that triggered the finding. */
  signalQuote: string;
}

/* ------------------------------------------------------------------ *
 * Audit runs (CC-P1-002)
 * ------------------------------------------------------------------ */

export type RunStatus = 'queued' | 'running' | 'paused' | 'succeeded' | 'partial' | 'failed';

export type RunTrigger = 'scheduled' | 'manual';

/**
 * Live triage breakdown for a run still in progress — how many of its
 * conversations have cleared review, how many carry an unresolved
 * safety-critical finding, and how many are still pending. `criticalOpen`
 * feeds the one legitimate non-badge use of safety/"Critical" red outside
 * `<SeverityBadge>`: it's a literal count of unresolved STOP/escalation
 * misses, not a generic urgency indicator.
 */
export interface RunProgress {
  cleared: number;
  criticalOpen: number;
  pending: number;
  total: number;
}

export interface AuditRun {
  id: string;
  /** A human-facing name for the run, e.g. "March release gate" — distinct from its ID. */
  label?: string;
  trigger: RunTrigger;
  triggeredBy?: string;
  status: RunStatus;
  /** Turns processed so far for a running/paused run; the final total once terminal. */
  turnsAudited: number;
  findingsCount: number;
  costUsd: number;
  costCapUsd: number;
  /** Set when the run stopped early on the cost cap — surfaces as a `partial` run. */
  capHit: boolean;
  startedAt: IsoDateTime;
  completedAt: IsoDateTime | null;
  configVersion: number;
  /** Present only while `status` is `queued` | `running` | `paused`. */
  progress?: RunProgress;
}

/* ------------------------------------------------------------------ *
 * Recommendations (CC-P1-014, 018, 019, 015)
 * ------------------------------------------------------------------ */

export type RecommendationKind = 'content_gap' | 'new_flow' | 'intent_merge' | 'prompt_change';

export interface Recommendation {
  id: string;
  kind: RecommendationKind;
  title: string;
  body: string;
  /** Turn IDs and metrics backing the recommendation. */
  evidence: string[];
  /** Present for content gaps — a drafted candidate answer for a human to approve. */
  draftLabel?: string;
  draft?: string;
  occurrences?: number;
  status: ReviewStatus;
  owner: FindingOwner;
  createdAt: IsoDateTime;
  /** Set once approved and handed to the external content workflow (BRD A-07). */
  routedTo?: string;
  routedAt?: IsoDateTime;
}

export type DecisionKind = 'approve' | 'request_changes' | 'reject';

export interface ReviewDecision {
  decision: DecisionKind;
  /** Required. Feeds the HIPAA/SOC-2 audit log (BRD 11). */
  comment: string;
}

/** A decision already recorded against a finding. */
export interface ReviewDecisionRecord extends ReviewDecision {
  findingId: string;
  actor: string;
  at: IsoDateTime;
  resultingStatus: ReviewStatus;
}

export interface DecisionResult {
  findingId: string;
  status: ReviewStatus;
  /** Owner the finding was routed to on approval. */
  routedTo: FindingOwner;
}

/**
 * Turn detail as returned by the API: the turn, the decisions recorded against
 * its findings, and its neighbours so a reviewer can work through the queue
 * without going back to the list each time.
 */
export interface TurnDetail extends ConversationTurn {
  decisions: ReviewDecisionRecord[];
  neighbours: {
    previousTurnId: string | null;
    nextTurnId: string | null;
  };
}

export interface QueueResponse {
  items: QueueItem[];
  total: number;
  /** Unfiltered open count, so the screen can say "3 of 8". */
  totalOpen: number;
  totalSafety: number;
  /** Unfiltered stats for the queue's stat strip — always over the full open set, regardless of the current filter/tab. */
  medianOpenAgeMinutes: number;
  decidedToday: number;
  asOf: IsoDateTime;
}

/* ------------------------------------------------------------------ *
 * Reporting and trends (CC-P1-013, 020)
 * ------------------------------------------------------------------ */

export interface FindingTypeCount {
  type: FindingType;
  label: string;
  owner: FindingOwner;
  count: number;
  safetyCritical: boolean;
}

export type TrendDirection = 'up' | 'down' | 'flat';

export interface IntentConfusionTrend {
  id: string;
  intentA: string;
  intentB: string;
  occurrences: number;
  windowDays: number;
  direction: TrendDirection;
  similarity?: number;
  aboveAlertThreshold: boolean;
}

export interface UnansweredTopic {
  id: string;
  topic: string;
  occurrences: number;
  status: 'not_drafted' | 'draft_ready' | 'routed';
  recommendationId?: string;
}

export interface ReportSummary {
  /** Headline success measure: >= 90% parity with a human reviewer (BRD 4.3). */
  parityPct: number;
  parityTarget: number;
  parityValidatedAt: IsoDateTime;
  problemsSurfaced: number;
  periodDays: number;
  trendsAboveThreshold: number;
  estimatedHoursSaved: number;
}

/* ------------------------------------------------------------------ *
 * Dashboard (prototype Overview)
 * ------------------------------------------------------------------ */

/**
 * Setup steps shown until the platform is operational.
 *
 * The API returns only the step's identity and state — titles and destination
 * routes are frontend concerns, mapped in `src/config/onboarding.ts`.
 */
export type OnboardingStepId = 'invite_team' | 'set_configuration' | 'work_queue';

export interface OnboardingStep {
  id: OnboardingStepId;
  complete: boolean;
  /** Current status in the operator's terms, e.g. "2 of 3 reviewers active". */
  detail: string;
}

export interface QueueBreakdown {
  safety: number;
  content: number;
  engineering: number;
}

export interface DashboardSummary {
  /** Null before the first audit run has completed. */
  lastRun: AuditRun | null;
  /** Findings across every run the backend holds (it exposes no date window). */
  findingsThisPeriod: number;
  /** Open safety-critical findings. Drives the loudest element on the screen. */
  safetyFindingsOpen: number;
  queueDepth: number;
  queueBreakdown: QueueBreakdown;
  onboarding: OnboardingStep[];
}

/**
 * Chrome-level context, used by the side rail badge and the top-bar crumb on
 * every screen — not just the dashboard.
 */
export interface AppContext {
  library: {
    version: string;
    pulledAt: IsoDateTime;
  };
  queueDepth: number;
  safetyFindingsOpen: number;
}

/* ------------------------------------------------------------------ *
 * Audit configuration (versioned; prototype Admin > Configuration)
 * ------------------------------------------------------------------ */

export type RunCadence = 'nightly' | 'twelve_hourly' | 'manual';

export type PopulationMode = 'full' | 'sampled';

export interface AuditConfig {
  version: number;
  active: boolean;
  savedBy: string;
  savedAt: IsoDateTime;
  note: string;

  safety: {
    stopEscalationDetection: boolean;
    /** Lower = catches more borderline cases, more false alarms (OQ-06). */
    falsePositiveTolerance: number;
    /** Safety findings are never sampled out of the queue. */
    alwaysIncludeInQueue: boolean;
  };

  batch: {
    cadence: RunCadence;
    populationMode: PopulationMode;
    samplePct: number;
    maxCostPerRunUsd: number;
  };

  models: {
    /** Cheap, fast first pass over every turn. */
    screeningModel: string;
    /** Deep second pass over screened hits; null disables the stage. */
    diagnosisModel: string | null;
  };

  enabledFindingTypes: FindingType[];
}

export interface ScheduledJob {
  id: string;
  name: string;
  active: boolean;
  cadence: RunCadence;
  nextRunAt: IsoDateTime | null;
  timezone: string;
}
