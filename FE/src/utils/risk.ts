import type { ConversationTurn, JsonValue, Severity } from '@/types/domain';

/**
 * Deterministic 0-100 "risk score" shown on the queue cards and the
 * turn-detail drawer.
 *
 * This is a display derivation from data we already have (severity +
 * confidence of the intent actually selected), not a separate model output.
 * CC-P1-017 names a "Risk Scoring Engine" as a real, distinct capability —
 * when that exists, its output replaces this function's return value, not the
 * `riskScore` field itself. Each severity tier gets a fixed band so the
 * number never contradicts the severity badge sitting next to it; confidence
 * only moves the score within that band (lower confidence in what was
 * selected reads as slightly riskier).
 */
export function computeRiskScore(severity: Severity, confidence: number): number {
  const shortfall = Math.max(0, Math.min(1, 1 - confidence));

  switch (severity) {
    case 'safety':
      return Math.round(90 + shortfall * 9); // 90–99
    case 'high':
      return Math.round(60 + shortfall * 25); // 60–85
    case 'medium':
      return Math.round(35 + shortfall * 20); // 35–55
    case 'low':
      return Math.round(10 + shortfall * 15); // 10–25
  }
}

export type EvidenceState = 'present' | 'missing' | 'not_collected';

export const evidenceStateLabel: Record<EvidenceState, string> = {
  present: 'Present',
  missing: 'Missing',
  not_collected: 'Not collected',
};

/**
 * Whether this turn's raw trace corroborates the finding with structured
 * evidence, beyond the model's own confidence score.
 *
 * Heuristic, not a real field a backend computes today — documented here so
 * it's easy to replace:
 *  1. If the trace has a `guardrails` object with any rule that evaluated to
 *     `false`, the corroborating check that should have caught this simply
 *     didn't run/pass — evidence is `missing`.
 *  2. If the turn carries a document, its legibility stands in for whether
 *     the evidence backing it is usable.
 *  3. Otherwise, if there's nothing structured beyond the model's own
 *     confidence (no documents, no picklist), evidence was `not_collected`
 *     rather than actively missing.
 */
export function deriveEvidenceState(turn: ConversationTurn): EvidenceState {
  const guardrails = findGuardrails(turn.rawTrace);
  if (guardrails && Object.values(guardrails).some((value) => value === false)) {
    return 'missing';
  }

  if (turn.documents && turn.documents.length > 0) {
    return turn.documents.some((doc) => doc.legibility !== 'clear') ? 'missing' : 'present';
  }

  if (turn.picklist || turn.survey) return 'present';

  return 'not_collected';
}

/** Looks for a top-level `guardrails` object in the raw trace, whatever its shape. */
function findGuardrails(trace: JsonValue): Record<string, JsonValue> | undefined {
  if (trace === null || typeof trace !== 'object' || Array.isArray(trace)) return undefined;
  const candidate = trace.guardrails;
  if (candidate === null || typeof candidate !== 'object' || Array.isArray(candidate)) return undefined;
  return candidate as Record<string, JsonValue>;
}
