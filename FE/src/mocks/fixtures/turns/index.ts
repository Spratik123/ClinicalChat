import type { ConversationTurn, Finding } from '@/types/domain';
import { missedStopTurn } from './missedStop';
import { intentMismatchTurn } from './intentMismatch';
import { documentVerificationTurn } from './documentVerification';
import { picklistMisselectionTurn } from './picklistMisselection';
import { contentGapTurn } from './contentGap';
import { surveyInterruptionTurn } from './surveyInterruption';

/**
 * Between them these six turns cover every audit dimension in the Phase 1
 * scope: flow mis-routing, top-N ranking, intent overlap, response-vs-intent,
 * picklist correctness, survey state, document extraction, verification-rule
 * logic, missing content, and a genuine AI miss — across two different
 * raw-trace shapes.
 */
export const mockTurns: ConversationTurn[] = [
  missedStopTurn,
  intentMismatchTurn,
  documentVerificationTurn,
  picklistMisselectionTurn,
  contentGapTurn,
  surveyInterruptionTurn,
];

export function findTurn(turnId: string): ConversationTurn | undefined {
  return mockTurns.find((turn) => turn.id === turnId);
}

/** Every finding across every turn, flattened. */
export function allFindings(): Finding[] {
  return mockTurns.flatMap((turn) => turn.findings);
}

export function findFinding(findingId: string): Finding | undefined {
  return allFindings().find((finding) => finding.id === findingId);
}
