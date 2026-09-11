import type { ConversationTurn } from '@/types/domain';

/**
 * Missing library content (CC-P1-004 / CC-P1-018).
 *
 * Nothing in the library answers an appeal question, so the bot fell back to a
 * generic menu. This is the turn behind recommendation REC-4001's drafted
 * answer — the audit's content-gap loop starts here.
 */
export const contentGapTurn: ConversationTurn = {
  id: 'T-88152',
  participantHash: 'ptc_c410de55',
  occurredAt: '2026-09-07T20:33:09Z',
  transcript: [
    {
      id: 'msg_1',
      direction: 'inbound',
      who: 'user',
      text: 'can i appeal if they said no to my application',
      at: '2026-09-07T20:33:09Z',
    },
    {
      id: 'msg_2',
      direction: 'outbound',
      who: 'bot',
      text: "I'm not sure about that one. Reply MENU to see what I can help with, or call your county office.",
      at: '2026-09-07T20:33:11Z',
    },
    { id: 'msg_3', direction: 'inbound', who: 'user', text: 'so theres nothing i can do?', at: '2026-09-07T20:34:40Z' },
  ],
  flow: { flowType: 'substantive_question', subFlow: 'general_question', correct: true },
  matchedIntents: [
    { rank: 1, name: 'fallback_unknown_question', confidence: 0.34, selected: true, rankingCorrect: true },
    { rank: 2, name: 'denial_reason_explainer', confidence: 0.31, selected: false, rankingCorrect: true },
  ],
  catalog: {
    libraryVersion: 'v128',
    snapshotId: 'snap_2026-08-29T02:00Z',
    bestCatalogMatch: 'none above threshold',
  },
  rawTrace: {
    graph_version: '2026.08.3',
    initial_classifier: { flow_type: 'substantive_question', confidence: 0.88 },
    sub_flow: {
      name: 'general_question',
      matched_intents: [
        { name: 'fallback_unknown_question', score: 0.34 },
        { name: 'denial_reason_explainer', score: 0.31 },
      ],
      threshold: 0.55,
      threshold_met: false,
    },
  },
  findings: [
    {
      id: 'FND-51130',
      turnId: 'T-88152',
      runId: 'RUN-2091',
      type: 'missing_content',
      severity: 'high',
      owner: 'content',
      title: 'No library content answers appeal questions',
      summary:
        'No intent covers appealing a denial. 22 conversations in the last 30 days asked a variant of this. A candidate answer has been drafted for review (REC-4001).',
      evidence: 'best_score=0.34 · threshold=0.55 · 22 similar turns in 30 days · no catalog match above threshold',
      status: 'open',
      createdAt: '2026-09-09T06:02:00Z',
    },
  ],
};
