import type { ConversationTurn } from '@/types/domain';

/**
 * Response-vs-intent mismatch with a narrow ranking margin.
 *
 * Carries a deliberately DIFFERENT raw-trace shape from the other turns (flat
 * `nodes` array, snake-cased, with `token_usage` and `experiment_flags` the app
 * has never seen). Schema flexibility is a hard NFR (FR-DATA-001, OQ-03), so
 * the trace viewer must be developed against a moving target from day one.
 */
export const intentMismatchTurn: ConversationTurn = {
  id: 'T-88190',
  participantHash: 'ptc_1cc4b8d2',
  occurredAt: '2026-09-08T15:20:11Z',
  transcript: [
    {
      id: 'msg_1',
      direction: 'inbound',
      who: 'user',
      text: 'do i need to send in my pay stubs again if i already sent them last month',
      at: '2026-09-08T15:20:11Z',
    },
    {
      id: 'msg_2',
      direction: 'outbound',
      who: 'bot',
      text: 'You can upload a pay stub by replying to this message with a photo. Make sure the whole document is visible.',
      at: '2026-09-08T15:20:13Z',
    },
  ],
  flow: { flowType: 'substantive_question', subFlow: 'income_verification', correct: true },
  matchedIntents: [
    {
      rank: 1,
      name: 'income_verification_paystub_upload',
      confidence: 0.88,
      selected: true,
      rankingCorrect: false,
      responseText:
        'You can upload a pay stub by replying to this message with a photo. Make sure the whole document is visible.',
    },
    {
      rank: 2,
      name: 'income_verification_already_submitted',
      confidence: 0.81,
      selected: false,
      rankingCorrect: false,
      responseText:
        "If you've already sent pay stubs this month, you don't need to send them again unless we ask.",
    },
    { rank: 3, name: 'income_verification_selfemployed', confidence: 0.44, selected: false, rankingCorrect: true },
  ],
  catalog: {
    libraryVersion: 'v128',
    snapshotId: 'snap_2026-08-29T02:00Z',
    bestCatalogMatch: 'income_verification_already_submitted',
  },
  // Trace shape "B" — flat node list, fields absent from shape A.
  rawTrace: {
    trace_schema: 'langgraph.v4',
    nodes: [
      { id: 'n0', kind: 'classify', out: { flow_type: 'substantive_question', p: 0.91 }, latency_ms: 210 },
      {
        id: 'n1',
        kind: 'retrieve_intents',
        out: {
          top_k: 3,
          names: ['income_verification_paystub_upload', 'income_verification_already_submitted'],
        },
        latency_ms: 640,
      },
      {
        id: 'n2',
        kind: 'rank',
        out: { winner: 'income_verification_paystub_upload', margin: 0.07 },
        latency_ms: 88,
      },
    ],
    token_usage: { input: 1840, output: 96, cache_read: 1200 },
    experiment_flags: ['rerank_v2', 'margin_guard_off'],
  },
  findings: [
    {
      id: 'FND-51101',
      turnId: 'T-88190',
      runId: 'RUN-2091',
      type: 'response_intent_mismatch',
      severity: 'high',
      owner: 'content',
      title: 'Response does not answer the question asked',
      summary:
        'The user asked whether a re-submission is required. The bot answered with upload instructions, which does not address the question. The correct intent ranked second at 0.81, only 0.07 behind.',
      evidence:
        'selected=income_verification_paystub_upload (0.88) · expected=income_verification_already_submitted (0.81) · margin=0.07 · experiment_flags=margin_guard_off',
      status: 'open',
      createdAt: '2026-09-09T06:02:00Z',
    },
    {
      id: 'FND-51102',
      turnId: 'T-88190',
      runId: 'RUN-2091',
      type: 'intent_overlap',
      severity: 'medium',
      owner: 'content',
      title: 'Overlapping intents matched together',
      summary:
        'income_verification_paystub_upload and income_verification_already_submitted are repeatedly matched together with a narrow margin. Their descriptions overlap.',
      evidence: 'cosine_similarity=0.87 · co-matched as top-2 in 9 turns over 30 days',
      // Already routed — exercises the "open only" filter on the queue.
      status: 'routed',
      createdAt: '2026-09-09T06:02:00Z',
    },
  ],
};
