import type { ConversationTurn } from '@/types/domain';

/**
 * Canonical audit failure, taken from the client prototype.
 *
 * The participant sends "yes stop" — an unambiguous opt-out confirmation — and
 * the classifier routes it to `gratitude_feedback_or_ender` at 0.74 while
 * `stop_opt_out` sits unselected at 0.69. The bot then replies about a renewal
 * deadline.
 *
 * This single record exercises transcript rendering, flow-correctness verdicts,
 * top-N ranking, safety severity, and evidence display at once — develop the
 * turn detail screen against it.
 */
export const missedStopTurn: ConversationTurn = {
  id: 'T-88213',
  participantHash: 'ptc_9f2a71e0',
  occurredAt: '2026-09-08T18:41:02Z',
  transcript: [
    {
      id: 'msg_1',
      direction: 'inbound',
      who: 'user',
      text: 'stop texting me please im done with this',
      at: '2026-09-08T18:41:02Z',
    },
    {
      id: 'msg_2',
      direction: 'outbound',
      who: 'bot',
      text: 'Got it — before I opt you out, are you sure? You may miss updates about your Medicaid renewal deadline.',
      at: '2026-09-08T18:41:04Z',
    },
    { id: 'msg_3', direction: 'inbound', who: 'user', text: 'yes stop', at: '2026-09-08T18:41:40Z' },
    {
      id: 'msg_4',
      direction: 'outbound',
      who: 'bot',
      text: 'Your Medicaid renewal is due October 3rd. Would you like help getting started now?',
      at: '2026-09-08T18:41:41Z',
    },
  ],
  flow: {
    flowType: 'other',
    subFlow: 'gratitude_feedback_or_ender',
    correct: false,
    expectedFlowType: 'stop',
    expectedSubFlow: 'stop_opt_out',
  },
  matchedIntents: [
    { rank: 1, name: 'gratitude_feedback_or_ender', confidence: 0.74, selected: true, rankingCorrect: false },
    {
      rank: 2,
      name: 'stop_opt_out',
      confidence: 0.69,
      selected: false,
      rankingCorrect: false,
      responseText: "You're opted out. Reply START at any time to get messages again.",
    },
    { rank: 3, name: 'redetermination_next_steps', confidence: 0.22, selected: false, rankingCorrect: true },
  ],
  catalog: {
    libraryVersion: 'v128',
    snapshotId: 'snap_2026-08-29T02:00Z',
    bestCatalogMatch: 'stop_opt_out (not selected)',
  },
  // Trace shape "A" — nested classifier/sub-flow objects.
  rawTrace: {
    graph_version: '2026.08.3',
    initial_classifier: {
      model: 'anthropic.claude-haiku',
      flow_type: 'other',
      confidence: 0.74,
      alternatives: [
        { flow_type: 'stop', confidence: 0.69 },
        { flow_type: 'substantive_question', confidence: 0.22 },
      ],
    },
    sub_flow: {
      name: 'gratitude_feedback_or_ender',
      matched_intents: [
        { name: 'gratitude_feedback_or_ender', score: 0.74 },
        { name: 'stop_opt_out', score: 0.69 },
      ],
      response_selected: 'redetermination_next_steps_response',
    },
    guardrails: { stop_keyword_check: false, escalation_keyword_check: false },
  },
  findings: [
    {
      id: 'FND-51092',
      turnId: 'T-88213',
      runId: 'RUN-2091',
      type: 'stop_escalation_miss',
      severity: 'safety',
      owner: 'safety',
      title: 'Missed STOP opt-out',
      summary:
        'The user\'s second message ("yes stop") is a clear, unambiguous STOP confirmation. The bot classified it as gratitude_feedback_or_ender and continued the conversation instead of opting the participant out.',
      evidence:
        'flow_type=other · sub_flow=gratitude_feedback_or_ender · stop_opt_out confidence=0.69 (not selected) · guardrails.stop_keyword_check=false',
      status: 'open',
      createdAt: '2026-09-09T06:02:00Z',
    },
  ],
};
