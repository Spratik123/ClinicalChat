import { findingTypeMeta } from '@/config/findingTypes';
import { computeRiskScore } from '@/utils/risk';
import type {
  AuditRun,
  ConversationTurn,
  Finding,
  FindingOwner,
  FindingType,
  JsonValue,
  QueueItem,
  ReviewDecisionRecord,
  ReviewStatus,
  RunStatus,
  Severity,
  TranscriptMessage,
} from '@/types/domain';
import type {
  AuditRunResponse,
  BackendRunStatus,
  FindingResponse,
  FindingReviewResponse,
  RunDashboardResponse,
} from './types';

/**
 * Bridges backend findings and runs to the UI's queue / turn / run models.
 *
 * The backend has no created-at on a finding, no flow/intent/picklist/survey
 * data, and no participant id, so those UI fields are derived or left neutral
 * here rather than invented.
 */

/* ------------------------------ Finding types ------------------------------ */

const typeFromBackend: Record<string, FindingType> = {
  stop_or_escalation_miss: 'stop_escalation_miss',
  ai_miss: 'genuine_ai_miss',
  semantic_mismatch: 'semantic_mismatch',
  overlap: 'intent_overlap',
  picklist: 'picklist_mismatch',
  response_vs_intent: 'response_intent_mismatch',
  missing_content: 'missing_content',
  flow_misroute: 'flow_misroute',
};

const typeToBackend = Object.fromEntries(Object.entries(typeFromBackend).map(([backend, ui]) => [ui, backend]));

export function toFindingType(backendType: string): FindingType {
  return typeFromBackend[backendType] ?? 'genuine_ai_miss';
}

export function toBackendFindingType(type: FindingType): string {
  return typeToBackend[type] ?? type;
}

/** The backend's "critical" tier is the UI's safety tier. */
export function toSeverity(backendSeverity: string, safetyRelated: boolean): Severity {
  if (safetyRelated || backendSeverity === 'critical') return 'safety';
  if (backendSeverity === 'high' || backendSeverity === 'medium' || backendSeverity === 'low') return backendSeverity;
  return 'medium';
}

function toOwner(finding: FindingResponse, type: FindingType): FindingOwner {
  const hint = finding.owner_hint;
  if (hint === 'safety' || hint === 'content' || hint === 'engineering') return hint;
  return findingTypeMeta[type].owner;
}

/* --------------------------------- Status ---------------------------------- */

/** Statuses that still need a human. Anything else has been decided. */
export const OPEN_STATUSES = ['DETECTED', 'OPEN', 'ASSIGNED', 'UNDER_REVIEW'] as const;

/**
 * Post-review statuses the list endpoint can be asked for. The API requires a
 * `run_id` or `status` filter, so "everything" means querying each in turn.
 * Observed: `agree: true` -> `APPROVED`; the rest are the likely counterparts.
 */
export const DECIDED_STATUSES = ['APPROVED', 'REJECTED', 'FALSE_POSITIVE', 'CHANGES_REQUESTED', 'RESOLVED', 'DISMISSED'] as const;

const openSet = new Set<string>(OPEN_STATUSES);

export function isOpenStatus(status: string): boolean {
  return openSet.has(status.toUpperCase());
}

export function toReviewStatus(status: string): ReviewStatus {
  const value = status.toUpperCase();
  if (openSet.has(value)) return 'open';
  if (value.includes('ROUTE')) return 'routed';
  if (value.includes('CHANGE')) return 'changes_requested';
  if (value.includes('REJECT') || value.includes('FALSE') || value.includes('DISMISS')) return 'rejected';
  return 'approved';
}

/* --------------------------------- Findings --------------------------------- */

export type RunLookup = ReadonlyMap<string, AuditRunResponse>;

/** No per-finding timestamp exists; the run's window end is the nearest honest proxy. */
function createdAtFor(finding: FindingResponse, runs: RunLookup): string {
  return finding.resolved_at ?? runs.get(finding.audit_run_id)?.window_until ?? new Date(0).toISOString();
}

function evidenceFor(finding: FindingResponse): string {
  const parts: string[] = [];
  if (finding.user_message) parts.push(`User: “${finding.user_message.trim()}”`);
  if (finding.bot_text) parts.push(`Bot: “${finding.bot_text.trim()}”`);
  if (finding.root_cause) parts.push(`Root cause: ${finding.root_cause}`);
  if (finding.recommended_action) parts.push(`Recommended: ${finding.recommended_action}`);
  return parts.join('\n');
}

export function toFinding(finding: FindingResponse, runs: RunLookup): Finding {
  const type = toFindingType(finding.finding_type);
  return {
    id: finding.finding_id,
    turnId: finding.audit_turn_id,
    runId: finding.audit_run_id,
    type,
    severity: toSeverity(finding.severity, finding.safety_related),
    owner: toOwner(finding, type),
    title: findingTypeMeta[type].label,
    summary: finding.summary,
    evidence: evidenceFor(finding),
    status: toReviewStatus(finding.status),
    createdAt: createdAtFor(finding, runs),
  };
}

export function toQueueItem(
  finding: FindingResponse,
  runs: RunLookup,
  assigneeName: (userId: number) => string,
): QueueItem {
  const mapped = toFinding(finding, runs);
  // The audit often reports no confidence; assume a coin-flip rather than
  // either extreme so the risk score is driven by severity.
  const confidence = finding.confidence ?? 0.5;

  return {
    turnId: finding.audit_turn_id,
    findingId: finding.finding_id,
    severity: mapped.severity,
    safetyCritical: mapped.severity === 'safety',
    findingType: mapped.type,
    findingLabel: mapped.title,
    flowType: 'other',
    confidence,
    participantHash: finding.audit_turn_id.slice(0, 8),
    status: mapped.status,
    createdAt: mapped.createdAt,
    priorityReason: finding.root_cause ?? undefined,
    riskScore: computeRiskScore(mapped.severity, confidence),
    assignee: finding.assigned_to_user_id == null ? null : assigneeName(finding.assigned_to_user_id),
    signalQuote: finding.user_message?.trim() || finding.summary,
  };
}

/** Safety first, then riskiest, then oldest — the queue's fixed ordering. */
export function compareQueueItems(a: QueueItem, b: QueueItem): number {
  return (
    Number(b.safetyCritical) - Number(a.safetyCritical) ||
    b.riskScore - a.riskScore ||
    Date.parse(a.createdAt) - Date.parse(b.createdAt)
  );
}

/* ----------------------------------- Turns ----------------------------------- */

function toTranscript(findings: FindingResponse[], at: string): TranscriptMessage[] {
  // Findings of one turn repeat the same exchange; take it from the first that has it.
  const source = findings.find((finding) => finding.user_message || finding.bot_text);
  if (!source) return [];

  const messages: TranscriptMessage[] = [];
  if (source.user_message) {
    messages.push({ id: `${source.audit_turn_id}-user`, direction: 'inbound', who: 'user', text: source.user_message.trim(), at });
  }
  if (source.bot_text) {
    messages.push({ id: `${source.audit_turn_id}-bot`, direction: 'outbound', who: 'bot', text: source.bot_text.trim(), at });
  }
  return messages;
}

export function toReviewDecisions(
  finding: FindingResponse,
  reviews: FindingReviewResponse[],
  reviewerName: (userId: number) => string,
): ReviewDecisionRecord[] {
  return reviews.map((review) => ({
    findingId: finding.finding_id,
    decision: review.agree ? 'approve' : review.is_false_positive ? 'reject' : 'request_changes',
    comment: review.comment ?? '',
    actor: reviewerName(review.reviewer_user_id),
    at: review.created_at ?? new Date(0).toISOString(),
    resultingStatus: review.agree ? 'approved' : review.is_false_positive ? 'rejected' : 'changes_requested',
  }));
}

export function toConversationTurn(
  turnId: string,
  findings: FindingResponse[],
  reviews: FindingReviewResponse[][],
  runs: RunLookup,
): ConversationTurn {
  const first = findings[0]!;
  const run = runs.get(first.audit_run_id);
  const scores = findings.map((finding) => finding.scores).find((candidate) => candidate != null);

  const occurredAt = run?.window_until ?? new Date(0).toISOString();

  return {
    id: turnId,
    participantHash: turnId.slice(0, 8),
    occurredAt,
    transcript: toTranscript(findings, occurredAt),
    // The backend does not expose flow routing or intent ranking, only whether
    // the flow was judged correct.
    flow: { flowType: 'other', subFlow: '—', correct: scores?.flow_correct ?? true },
    matchedIntents: [],
    catalog: {
      libraryVersion: run?.library_snapshot_id?.split('#')[0] ?? '—',
      snapshotId: run?.library_snapshot_id ?? '—',
    },
    // Everything the backend knows, so the raw-trace panel stays useful.
    rawTrace: { findings, reviews } as unknown as JsonValue,
    findings: findings.map((finding) => toFinding(finding, runs)),
  };
}

/* ------------------------------------ Runs ------------------------------------ */

const runStatusFromBackend: Record<BackendRunStatus, RunStatus> = {
  queued: 'queued',
  running: 'running',
  completed: 'succeeded',
  partial: 'partial',
  failed: 'failed',
  cancelled: 'failed',
};

export interface RunExtras {
  dashboard?: RunDashboardResponse;
  /** Per-run spend cap from the run's config version, in USD. */
  costCapUsd?: number;
  findingsCount?: number;
}

export function toAuditRun(run: AuditRunResponse, extras: RunExtras = {}): AuditRun {
  const status = runStatusFromBackend[run.status] ?? 'failed';
  const counts = run.counts ?? {};
  const total = counts.total ?? extras.dashboard?.turns_total ?? 0;
  const completed = counts.completed ?? 0;
  const failed = counts.failed ?? 0;
  const costUsd = Number(extras.dashboard?.spent_usd ?? 0);
  const costCapUsd = extras.costCapUsd ?? 0;
  const terminal = status === 'succeeded' || status === 'partial' || status === 'failed';

  return {
    id: run.run_id,
    label: run.run_key,
    trigger: run.run_key.startsWith('manual') ? 'manual' : 'scheduled',
    status,
    turnsAudited: completed,
    findingsCount: extras.dashboard?.findings_total ?? extras.findingsCount ?? 0,
    costUsd,
    costCapUsd,
    capHit: costCapUsd > 0 && costUsd >= costCapUsd,
    // The backend records neither start nor finish times, only the audited window.
    startedAt: run.window_since,
    completedAt: terminal ? run.window_until : null,
    configVersion: run.config_version_number,
    progress:
      status === 'running' || status === 'queued'
        ? { cleared: completed, criticalOpen: 0, pending: Math.max(0, total - completed - failed), total }
        : undefined,
  };
}
