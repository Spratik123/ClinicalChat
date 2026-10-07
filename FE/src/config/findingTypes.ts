import { tokens } from '@/theme/tokens';
import type { FindingOwner, FindingType, Severity } from '@/types/domain';

/**
 * The five failure categories used by the review queue's tags and the
 * Insights/Reports breakdown (BRD 9.7, CC-P1-020) — client screenshot calls
 * these "issue buckets".
 */
export type FindingCategory =
  | 'safety_policy'
  | 'intent_quality'
  | 'knowledge_coverage'
  | 'conversation_flow'
  | 'evidence_quality';

export const categoryMeta: Record<FindingCategory, { label: string; fg: string; bg: string }> = {
  safety_policy: { label: 'Safety / policy', ...tokens.category.safetyPolicy },
  intent_quality: { label: 'Intent quality', ...tokens.category.intentQuality },
  knowledge_coverage: { label: 'Knowledge coverage', ...tokens.category.knowledgeCoverage },
  conversation_flow: { label: 'Conversation flow', ...tokens.category.conversationFlow },
  evidence_quality: { label: 'Evidence quality', ...tokens.category.evidenceQuality },
};

interface FindingTypeMeta {
  label: string;
  /** Who acts on it — drives change routing (CC-P1-019, OQ-05). */
  owner: FindingOwner;
  /**
   * True only for missed STOP opt-outs and missed emergency / self-harm
   * escalations. These carry regulatory and human-safety weight (BRD 4.2) and
   * are the only findings allowed to use safety/"Critical" red.
   */
  safetyCritical: boolean;
  defaultSeverity: Severity;
  category: FindingCategory;
  /**
   * Generic per-type recommended action, shown in the turn-detail drawer's
   * "Proposed review action" card. Deliberately templated at the type level,
   * not written per finding instance — a real recommendation engine would
   * generate this per case, but the *routing* language (approve → routed to
   * an owner, never a direct library edit) must hold for every instance.
   */
  proposedAction: string;
}

/**
 * Display metadata for every finding type the audit can emit.
 *
 * Single source of truth: the dashboard breakdown, the queue filters, the
 * queue cards' tags, and the turn-detail drawer all read from here, so a
 * label, owner, or category never drifts between screens.
 */
export const findingTypeMeta: Record<FindingType, FindingTypeMeta> = {
  stop_escalation_miss: {
    label: 'Missed STOP / escalation',
    owner: 'safety',
    safetyCritical: true,
    defaultSeverity: 'safety',
    category: 'safety_policy',
    proposedAction: 'Add STOP/escalation handling guardrail and route to CMS policy review',
  },
  response_intent_mismatch: {
    label: 'Response-vs-intent mismatch',
    owner: 'content',
    safetyCritical: false,
    defaultSeverity: 'high',
    category: 'intent_quality',
    proposedAction: 'Approve drafted response fix and route to content workflow',
  },
  missing_content: {
    label: 'Missing library content',
    owner: 'content',
    safetyCritical: false,
    defaultSeverity: 'high',
    category: 'knowledge_coverage',
    proposedAction: 'Approve drafted answer and route to content workflow',
  },
  genuine_ai_miss: {
    label: 'Genuine AI miss',
    owner: 'engineering',
    safetyCritical: false,
    defaultSeverity: 'high',
    category: 'intent_quality',
    proposedAction: 'Route flow/prompt defect to engineering for investigation',
  },
  semantic_mismatch: {
    label: 'High-confidence semantic mismatch',
    owner: 'content',
    safetyCritical: false,
    defaultSeverity: 'high',
    category: 'intent_quality',
    proposedAction: 'Approve drafted disambiguation fix and route to content workflow',
  },
  intent_overlap: {
    label: 'Intent overlap',
    owner: 'content',
    safetyCritical: false,
    defaultSeverity: 'medium',
    category: 'knowledge_coverage',
    proposedAction: 'Approve suggested intent merge and route to content workflow',
  },
  picklist_mismatch: {
    label: 'Picklist mis-selection',
    owner: 'content',
    safetyCritical: false,
    defaultSeverity: 'medium',
    category: 'conversation_flow',
    proposedAction: 'Approve picklist update and route to content workflow',
  },
  survey_state_error: {
    label: 'Survey handling error',
    owner: 'content',
    safetyCritical: false,
    defaultSeverity: 'medium',
    category: 'conversation_flow',
    proposedAction: 'Approve survey-flow fix and route to content workflow',
  },
  document_extraction: {
    label: 'Extraction quality',
    owner: 'content',
    safetyCritical: false,
    defaultSeverity: 'medium',
    category: 'evidence_quality',
    proposedAction: 'Flag for re-capture guidance and route to content workflow',
  },
  verification_rule_error: {
    label: 'Verification-rule error',
    owner: 'engineering',
    safetyCritical: false,
    defaultSeverity: 'high',
    category: 'evidence_quality',
    proposedAction: 'Approve corrected verification rule and route to engineering',
  },
  flow_misroute: {
    label: 'Flow mis-route',
    owner: 'engineering',
    safetyCritical: false,
    defaultSeverity: 'high',
    category: 'conversation_flow',
    proposedAction: 'Route the mis-routed flow to engineering for investigation',
  },
  prompt_gap: {
    label: 'Prompt-change suggestion',
    owner: 'engineering',
    safetyCritical: false,
    defaultSeverity: 'low',
    category: 'intent_quality',
    proposedAction: 'Approve suggested prompt wording change and route to engineering',
  },
};

export const ownerLabels: Record<FindingOwner, string> = {
  safety: 'Safety',
  content: 'Content',
  engineering: 'Engineering',
};
