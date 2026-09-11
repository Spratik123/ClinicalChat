import type {
  AuditConfig,
  AuditRun,
  FindingTypeCount,
  IntentConfusionTrend,
  Recommendation,
  ReportSummary,
  ScheduledJob,
  UnansweredTopic,
} from '@/types/domain';

export const mockFindingsByType: FindingTypeCount[] = [
  { type: 'stop_escalation_miss', label: 'Missed STOP / escalation', owner: 'safety', count: 1, safetyCritical: true },
  { type: 'response_intent_mismatch', label: 'Response-vs-intent mismatch', owner: 'content', count: 18, safetyCritical: false },
  { type: 'missing_content', label: 'Missing library content', owner: 'content', count: 14, safetyCritical: false },
  { type: 'genuine_ai_miss', label: 'Genuine AI miss', owner: 'engineering', count: 11, safetyCritical: false },
  { type: 'intent_overlap', label: 'Intent overlap', owner: 'content', count: 9, safetyCritical: false },
  { type: 'document_extraction', label: 'Extraction quality', owner: 'content', count: 4, safetyCritical: false },
];

/**
 * "Now" for the fixtures that need to look current regardless of when the
 * demo is actually opened — the run-in-progress card and the scheduler's
 * "next run" both anchor off this rather than a hardcoded date.
 */
const now = Date.now();
const hoursAgo = (hours: number) => new Date(now - hours * 60 * 60 * 1000).toISOString();
const hoursFromNow = (hours: number) => new Date(now + hours * 60 * 60 * 1000).toISOString();

export const mockRuns: AuditRun[] = [
  {
    // In progress: the audit pass itself finished, but per BRD's
    // human-in-the-loop rule a batch isn't really "done" until its findings
    // are triaged — so this stays non-terminal until review catches up.
    id: 'RUN-2092',
    label: 'March release gate',
    trigger: 'manual',
    triggeredBy: 'Dana Whitfield',
    status: 'running',
    turnsAudited: 58,
    findingsCount: 16, // 3 critical open + 13 pending — the 42 cleared turns carried no unresolved finding.
    costUsd: 1.85,
    costCapUsd: 3,
    capHit: false,
    startedAt: hoursAgo(6),
    completedAt: null,
    configVersion: 4,
    progress: { cleared: 42, criticalOpen: 3, pending: 13, total: 58 },
  },
  {
    id: 'RUN-2091',
    trigger: 'scheduled',
    status: 'succeeded',
    turnsAudited: 1842,
    findingsCount: 57,
    costUsd: 4.1,
    costCapUsd: 6,
    capHit: false,
    startedAt: '2026-09-09T06:00:00Z',
    completedAt: '2026-09-09T06:22:00Z',
    configVersion: 4,
  },
  {
    id: 'RUN-2090',
    trigger: 'scheduled',
    status: 'succeeded',
    turnsAudited: 1791,
    findingsCount: 49,
    costUsd: 3.85,
    costCapUsd: 6,
    capHit: false,
    startedAt: '2026-09-08T06:00:00Z',
    completedAt: '2026-09-08T06:19:00Z',
    configVersion: 4,
  },
  {
    id: 'RUN-2089',
    trigger: 'manual',
    triggeredBy: 'D. Whitfield',
    status: 'partial',
    turnsAudited: 1804,
    findingsCount: 31,
    costUsd: 6,
    costCapUsd: 6,
    // Stopped early on the cost cap — the reason a run can be `partial`.
    capHit: true,
    startedAt: '2026-09-07T11:20:00Z',
    completedAt: '2026-09-07T11:39:00Z',
    configVersion: 3,
  },
  {
    id: 'RUN-2088',
    trigger: 'scheduled',
    status: 'succeeded',
    turnsAudited: 1699,
    findingsCount: 44,
    costUsd: 3.6,
    costCapUsd: 6,
    capHit: false,
    startedAt: '2026-09-06T06:00:00Z',
    completedAt: '2026-09-06T06:17:00Z',
    configVersion: 3,
  },
];

export function findRun(id: string): AuditRun | undefined {
  return mockRuns.find((run) => run.id === id);
}

let runSequence = 2093;

/**
 * Kicks off an ad-hoc run (FR-ENG-001's manual-trigger path). Uses the
 * currently active audit configuration's cost cap and version, same as a
 * real "Run now" would — this is not a separate, ungoverned code path.
 */
export function createManualRun(input: { triggeredBy: string }): AuditRun {
  const activeConfig = mockConfigVersions.find((version) => version.active);
  const run: AuditRun = {
    id: `RUN-${runSequence++}`,
    trigger: 'manual',
    triggeredBy: input.triggeredBy,
    status: 'queued',
    turnsAudited: 0,
    findingsCount: 0,
    costUsd: 0,
    costCapUsd: activeConfig?.batch.maxCostPerRunUsd ?? 6,
    capHit: false,
    startedAt: new Date().toISOString(),
    completedAt: null,
    configVersion: activeConfig?.version ?? 4,
  };
  mockRuns.unshift(run);
  return run;
}

export const mockRecommendations: Recommendation[] = [
  {
    id: 'REC-4001',
    kind: 'content_gap',
    title: 'Draft answer — "How to appeal a denied application"',
    body: '22 conversations in the last 30 days asked a variant of this question with no matching intent.',
    evidence: [
      'T-87990 — "can I appeal if they said no"',
      'T-88041 — "how do I fight the denial"',
      '+ 20 more turns',
    ],
    draftLabel: 'Drafted answer',
    draft:
      '"You can appeal a denial within 60 days of the decision letter. We\'ll text you the appeal form link and walk you through what to include — reply APPEAL to start."',
    occurrences: 22,
    status: 'open',
    owner: 'content',
    createdAt: '2026-09-09T06:02:00Z',
  },
  {
    id: 'REC-4002',
    kind: 'new_flow',
    title: 'New flow — HR1 work-requirement exemption review',
    body: "11 conversations about exemption review timelines don't map cleanly to any existing flow; they keep getting routed to the general HR1 explainer instead.",
    evidence: ['T-87812', 'T-87950', 'T-88066', '+ 8 more turns'],
    occurrences: 11,
    status: 'open',
    owner: 'content',
    createdAt: '2026-09-09T06:02:00Z',
  },
  {
    id: 'REC-4003',
    kind: 'intent_merge',
    title: 'Merge — income_verification_paystub ↔ income_verification_selfemployed',
    body: 'These two intents overlap heavily in description and are frequently both matched with similar confidence for the same message.',
    evidence: ['Cosine similarity: 0.91', '9 turns in the last 30 days matched both as top-2 candidates'],
    occurrences: 9,
    status: 'open',
    owner: 'content',
    createdAt: '2026-09-09T06:02:00Z',
  },
  {
    id: 'REC-4004',
    kind: 'prompt_change',
    title: 'Prompt suggestion — survey interruption handling',
    body: "The re-ask prompt after a survey interruption doesn't restate which question was interrupted, leading to confused corrections.",
    evidence: ['T-87701', 'T-87889', 'T-88012'],
    occurrences: 3,
    status: 'open',
    owner: 'engineering',
    createdAt: '2026-09-09T06:02:00Z',
  },
  {
    id: 'REC-4005',
    kind: 'content_gap',
    title: 'Draft answer — "What counts as proof of Colorado residency"',
    body: '15 conversations in the last 30 days asked a variant of this question with no matching intent.',
    evidence: ['T-88003 — "does a lease count as residency proof"', 'T-88077 — "what if my mail comes to my moms house"', '+ 13 more turns'],
    draftLabel: 'Drafted answer',
    draft:
      '"A lease, utility bill, or paycheck with your Colorado address from the last 60 days all work. If your name isn\'t on the bill, a signed letter from who it belongs to is fine too."',
    occurrences: 15,
    status: 'open',
    owner: 'content',
    createdAt: '2026-09-08T06:02:00Z',
  },
];

export function findRecommendation(id: string): Recommendation | undefined {
  return mockRecommendations.find((rec) => rec.id === id);
}

export const mockReportSummary: ReportSummary = {
  parityPct: 91.4,
  parityTarget: 90,
  parityValidatedAt: '2026-08-24T00:00:00Z',
  problemsSurfaced: 312,
  periodDays: 30,
  trendsAboveThreshold: 2,
  estimatedHoursSaved: 38,
};

export const mockTrends: IntentConfusionTrend[] = [
  {
    id: 'TRD-01',
    intentA: 'medicaid_renewal_deadline',
    intentB: 'redetermination_next_steps',
    occurrences: 14,
    windowDays: 30,
    direction: 'up',
    aboveAlertThreshold: true,
  },
  {
    id: 'TRD-02',
    intentA: 'income_verification_paystub',
    intentB: 'income_verification_selfemployed',
    occurrences: 9,
    windowDays: 30,
    direction: 'up',
    similarity: 0.91,
    aboveAlertThreshold: true,
  },
  {
    id: 'TRD-03',
    intentA: 'hr1_work_requirement_explainer',
    intentB: 'work_requirement_exemption',
    occurrences: 7,
    windowDays: 30,
    direction: 'flat',
    aboveAlertThreshold: false,
  },
];

export const mockUnanswered: UnansweredTopic[] = [
  {
    id: 'UNA-01',
    topic: 'How to appeal a denied Medicaid application',
    occurrences: 22,
    status: 'draft_ready',
    recommendationId: 'REC-4001',
  },
  {
    id: 'UNA-02',
    topic: 'What counts as proof of Colorado residency',
    occurrences: 15,
    status: 'draft_ready',
    recommendationId: 'REC-4005',
  },
  { id: 'UNA-03', topic: 'Timeline for HR1 work-requirement exemption review', occurrences: 11, status: 'not_drafted' },
];

export const mockConfigVersions: AuditConfig[] = [
  {
    version: 4,
    active: true,
    savedBy: 'Dana Whitfield',
    savedAt: '2026-08-29T00:00:00Z',
    note: 'Lowered escalation false-positive tolerance after OQ-06 sign-off',
    safety: { stopEscalationDetection: true, falsePositiveTolerance: 0.2, alwaysIncludeInQueue: true },
    batch: { cadence: 'nightly', populationMode: 'full', samplePct: 100, maxCostPerRunUsd: 6 },
    models: {
      screeningModel: 'bedrock/anthropic.claude-haiku',
      diagnosisModel: 'bedrock/anthropic.claude-sonnet',
    },
    enabledFindingTypes: [
      'missing_content',
      'genuine_ai_miss',
      'stop_escalation_miss',
      'response_intent_mismatch',
      'intent_overlap',
      'prompt_gap',
    ],
  },
  {
    version: 3,
    active: false,
    savedBy: 'Dana Whitfield',
    savedAt: '2026-08-14T00:00:00Z',
    note: 'Enabled intent-overlap finding type',
    safety: { stopEscalationDetection: true, falsePositiveTolerance: 0.35, alwaysIncludeInQueue: true },
    batch: { cadence: 'nightly', populationMode: 'sampled', samplePct: 40, maxCostPerRunUsd: 6 },
    models: {
      screeningModel: 'bedrock/anthropic.claude-haiku',
      diagnosisModel: 'bedrock/anthropic.claude-sonnet',
    },
    enabledFindingTypes: [
      'missing_content',
      'genuine_ai_miss',
      'stop_escalation_miss',
      'response_intent_mismatch',
      'intent_overlap',
    ],
  },
];

export function findConfigVersion(version: number): AuditConfig | undefined {
  return mockConfigVersions.find((config) => config.version === version);
}

/**
 * Saves a new, non-editable-in-place config version — the active version
 * never changes, a new one supersedes it, exactly like the version history
 * panel implies. Draft edits become "the config" only once this runs.
 */
export function createConfigVersion(
  input: Pick<AuditConfig, 'safety' | 'batch' | 'models' | 'enabledFindingTypes' | 'note'>,
  savedBy: string,
): AuditConfig {
  const nextVersion = Math.max(...mockConfigVersions.map((config) => config.version)) + 1;
  const version: AuditConfig = {
    version: nextVersion,
    active: true,
    savedBy,
    savedAt: new Date().toISOString(),
    ...input,
  };
  for (const existing of mockConfigVersions) existing.active = false;
  mockConfigVersions.unshift(version);
  return version;
}

export const mockScheduledJob: ScheduledJob = {
  id: 'JOB-nightly',
  name: 'Nightly audit job',
  active: true,
  cadence: 'nightly',
  // Anchored to "now" rather than a fixed date so the Audit runs screen
  // still shows a sensible "next run" whenever this demo is actually opened.
  nextRunAt: hoursFromNow(18),
  timezone: 'America/Denver',
};
