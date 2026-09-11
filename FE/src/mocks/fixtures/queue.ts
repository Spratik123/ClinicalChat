import { findingTypeMeta } from '@/config/findingTypes';
import { severityRank } from '@/theme/tokens';
import { computeRiskScore } from '@/utils/risk';
import { mockTurns } from './turns';
import type { ConversationTurn, Finding, FindingType, QueueItem } from '@/types/domain';

/**
 * Why each finding type earns human attention.
 *
 * Stands in for the engine's "risk explanation" output (CC-P1-017), which the
 * real API supplies per item.
 */
const priorityReasons: Record<FindingType, string> = {
  stop_escalation_miss: 'Safety-critical: an opt-out or emergency escalation was not honoured. Never sampled out.',
  verification_rule_error: 'A wrong verification outcome can push a participant toward a procedural denial.',
  response_intent_mismatch: 'Matched at high confidence but semantically wrong — invisible to confidence thresholds.',
  semantic_mismatch: 'High-confidence match that does not address the question asked.',
  missing_content: 'Recurring question with no answer in the library.',
  genuine_ai_miss: 'Content existed and matched; the defect is in the flow. Routes to engineering.',
  intent_overlap: 'Overlapping intents reduce matching accuracy across every similar turn.',
  picklist_mismatch: 'The menu did not contain an option for what the user asked.',
  survey_state_error: 'Survey left incomplete, which affects the verification outcome.',
  document_extraction: 'Source document was not readable, so the verification result is unreliable.',
  prompt_gap: 'Prompt wording is a likely cause of repeated misses.',
};

/**
 * Assignment is tracked here rather than on the `Finding` object itself: it's
 * a queue/worklist concept ("who is working this"), not part of the audit's
 * findings record. Keyed by finding ID, reset on a full page reload same as
 * every other mock-layer mutation.
 */
const assignments = new Map<string, string>();

export function assignQueueItem(findingId: string, assignee: string): void {
  assignments.set(findingId, assignee);
}

/** The participant message that most directly triggered the finding — shown as a quote on the queue card. */
function signalQuoteFor(turn: ConversationTurn): string {
  const userMessages = turn.transcript.filter((message) => message.who === 'user');
  const last = userMessages.at(-1);
  return last?.text ?? turn.transcript[0]?.text ?? '';
}

function toQueueItem(turn: ConversationTurn, finding: Finding): QueueItem {
  const selected = turn.matchedIntents.find((intent) => intent.selected);
  // Confidence of the intent production actually selected.
  const confidence = selected?.confidence ?? 0;

  return {
    turnId: turn.id,
    findingId: finding.id,
    severity: finding.severity,
    safetyCritical: findingTypeMeta[finding.type].safetyCritical,
    findingType: finding.type,
    findingLabel: finding.title,
    flowType: turn.flow.flowType,
    confidence,
    participantHash: turn.participantHash,
    status: finding.status,
    createdAt: finding.createdAt,
    priorityReason: priorityReasons[finding.type],
    riskScore: computeRiskScore(finding.severity, confidence),
    assignee: assignments.get(finding.id) ?? null,
    signalQuote: signalQuoteFor(turn),
  };
}

/**
 * The queue, derived from the turn fixtures rather than hand-written.
 *
 * Recomputed on every call so a recorded decision (which mutates the finding on
 * its turn) is reflected here without a second source of truth to update.
 */
export function buildQueue(): QueueItem[] {
  return mockTurns
    .flatMap((turn) => turn.findings.map((finding) => toQueueItem(turn, finding)))
    .sort(
      (a, b) =>
        // 1. Safety-critical first, unconditionally (BRD 4.2, CC-P1-017).
        Number(b.safetyCritical) - Number(a.safetyCritical) ||
        // 2. Then by severity.
        severityRank[a.severity] - severityRank[b.severity] ||
        // 3. Then oldest first, so nothing rots at the bottom.
        Date.parse(a.createdAt) - Date.parse(b.createdAt) ||
        a.findingId.localeCompare(b.findingId),
    );
}

export function findQueueItem(findingId: string): QueueItem | undefined {
  return buildQueue().find((item) => item.findingId === findingId);
}
