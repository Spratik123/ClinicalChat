import type { ConversationTurn } from '@/types/domain';

/**
 * Survey interruption handling (CC-P1-010) plus a genuine AI miss
 * (CC-P1-004b).
 *
 * The participant interrupts a survey with an unrelated question. The bot
 * answers it but never re-asks the interrupted question, so the survey stalls
 * silently. The content existed and was matched — the failure is in the
 * re-ask transition, which routes to engineering rather than content.
 */
export const surveyInterruptionTurn: ConversationTurn = {
  id: 'T-88140',
  participantHash: 'ptc_82b6ff31',
  occurredAt: '2026-09-07T16:02:18Z',
  transcript: [
    {
      id: 'msg_1',
      direction: 'outbound',
      who: 'bot',
      text: 'How many people live in your household, including yourself?',
      at: '2026-09-07T16:01:40Z',
    },
    {
      id: 'msg_2',
      direction: 'inbound',
      who: 'user',
      text: 'wait does my renewal deadline change if i move counties',
      at: '2026-09-07T16:02:18Z',
    },
    {
      id: 'msg_3',
      direction: 'outbound',
      who: 'bot',
      text: 'Moving within Colorado does not change your renewal date, but you should report the new address.',
      at: '2026-09-07T16:02:20Z',
    },
    { id: 'msg_4', direction: 'inbound', who: 'user', text: 'ok', at: '2026-09-07T16:03:55Z' },
    {
      id: 'msg_5',
      direction: 'outbound',
      who: 'bot',
      text: 'Thanks! Reply MENU any time.',
      at: '2026-09-07T16:03:56Z',
    },
  ],
  flow: {
    flowType: 'survey_household_size',
    subFlow: 'survey_interruption',
    correct: true,
  },
  matchedIntents: [
    { rank: 1, name: 'renewal_date_after_county_move', confidence: 0.86, selected: true, rankingCorrect: true },
    { rank: 2, name: 'report_a_change_income_address', confidence: 0.52, selected: false, rankingCorrect: true },
  ],
  catalog: {
    libraryVersion: 'v128',
    snapshotId: 'snap_2026-08-29T02:00Z',
    bestCatalogMatch: 'renewal_date_after_county_move',
  },
  survey: {
    surveyName: 'household_size',
    stage: 'interruption',
    questionKey: 'household_member_count',
    // The interruption was answered correctly; the re-ask never happened.
    handledCorrectly: false,
    notes:
      'Interruption answered, but the survey was closed with an ender instead of re-asking household_member_count. The survey is left incomplete with no retry scheduled.',
  },
  rawTrace: {
    trace_schema: 'langgraph.v4',
    survey_context: {
      name: 'household_size',
      question: 'household_member_count',
      state_before: 'awaiting_response',
      state_after: 'closed',
      reask_scheduled: false,
    },
    nodes: [
      { id: 'n0', kind: 'classify', out: { flow_type: 'survey_household_size', p: 0.79 } },
      { id: 'n1', kind: 'detect_interruption', out: { interrupted: true, resume_token: 'household_member_count' } },
      { id: 'n2', kind: 'answer_interruption', out: { intent: 'renewal_date_after_county_move', p: 0.86 } },
      // The resume token was produced but never consumed.
      { id: 'n3', kind: 'resume_survey', out: { resumed: false, reason: 'ender_matched_first' } },
    ],
  },
  findings: [
    {
      id: 'FND-51141',
      turnId: 'T-88140',
      runId: 'RUN-2091',
      type: 'genuine_ai_miss',
      severity: 'high',
      owner: 'engineering',
      title: 'Survey not resumed after interruption',
      summary:
        'A resume token was generated for household_member_count but the ender intent matched first and closed the survey. The content existed and matched correctly — this is a flow-transition defect, not a content gap.',
      evidence:
        'resume_token=household_member_count · resume_survey.resumed=false · reason=ender_matched_first · state_after=closed · reask_scheduled=false',
      status: 'open',
      createdAt: '2026-09-09T06:02:00Z',
    },
    {
      id: 'FND-51140',
      turnId: 'T-88140',
      runId: 'RUN-2091',
      type: 'survey_state_error',
      severity: 'medium',
      owner: 'content',
      title: 'Re-ask prompt does not restate the interrupted question',
      summary:
        'The re-ask copy for household_size does not repeat which question was interrupted, so participants who do resume often answer the wrong question.',
      evidence: 'survey=household_size · stage=interruption · 3 similar turns in 30 days',
      status: 'open',
      createdAt: '2026-09-09T06:02:00Z',
    },
  ],
};
