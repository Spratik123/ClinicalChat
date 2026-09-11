import type { ConversationTurn } from '@/types/domain';

/**
 * Picklist correctness (CC-P1-009).
 *
 * The participant asks about adding a newborn. The picklist offered no option
 * for that, so option 2 ("Report a change") routed them into a generic change
 * flow. Every individual step "worked" — the failure is that the menu did not
 * contain what the user asked for, which intent checks alone do not catch.
 */
export const picklistMisselectionTurn: ConversationTurn = {
  id: 'T-88165',
  participantHash: 'ptc_3ae90b17',
  occurredAt: '2026-09-08T09:14:22Z',
  transcript: [
    {
      id: 'msg_1',
      direction: 'inbound',
      who: 'user',
      text: 'how do i add my newborn to my case',
      at: '2026-09-08T09:14:22Z',
    },
    {
      id: 'msg_2',
      direction: 'outbound',
      who: 'bot',
      text: 'What would you like help with?\n1. Renew my coverage\n2. Report a change\n3. Upload a document\n4. Something else',
      at: '2026-09-08T09:14:24Z',
    },
    { id: 'msg_3', direction: 'inbound', who: 'user', text: '2', at: '2026-09-08T09:15:02Z' },
    {
      id: 'msg_4',
      direction: 'outbound',
      who: 'bot',
      text: 'To report a change in income or address, reply with the change and we will update your case.',
      at: '2026-09-08T09:15:03Z',
    },
  ],
  flow: { flowType: 'picklist_selection', subFlow: 'picklist_route', correct: true },
  matchedIntents: [
    { rank: 1, name: 'report_a_change_income_address', confidence: 0.91, selected: true, rankingCorrect: false },
    { rank: 2, name: 'add_household_member', confidence: 0.58, selected: false, rankingCorrect: false },
    { rank: 3, name: 'renewal_start', confidence: 0.19, selected: false, rankingCorrect: true },
  ],
  catalog: {
    libraryVersion: 'v128',
    snapshotId: 'snap_2026-08-29T02:00Z',
    bestCatalogMatch: 'add_household_member',
  },
  picklist: {
    presented: true,
    selectedPosition: 2,
    // The option the user picked is not the option that answers their question.
    selectionMatchedRequest: false,
    options: [
      { position: 1, label: 'Renew my coverage', intentName: 'renewal_start', active: true },
      { position: 2, label: 'Report a change', intentName: 'report_a_change_income_address', active: true },
      { position: 3, label: 'Upload a document', intentName: 'survey_document_upload_prompt', active: true },
      { position: 4, label: 'Something else', intentName: 'fallback_menu', active: true },
    ],
  },
  rawTrace: {
    graph_version: '2026.08.3',
    initial_classifier: { flow_type: 'substantive_question', confidence: 0.83 },
    picklist_render: {
      menu_id: 'main_help_menu_v6',
      options: ['renewal_start', 'report_a_change_income_address', 'survey_document_upload_prompt', 'fallback_menu'],
      candidate_intents_excluded: [{ name: 'add_household_member', reason: 'not_in_menu_config' }],
    },
    selection: { raw_input: '2', resolved_intent: 'report_a_change_income_address' },
  },
  findings: [
    {
      id: 'FND-51120',
      turnId: 'T-88165',
      runId: 'RUN-2091',
      type: 'picklist_mismatch',
      severity: 'medium',
      owner: 'content',
      title: 'Picklist offered no option for the question asked',
      summary:
        'The user asked how to add a newborn. add_household_member exists in the library but is excluded from main_help_menu_v6, so the closest option ("Report a change") sent them to an income/address flow instead.',
      evidence:
        'menu=main_help_menu_v6 · selected_position=2 → report_a_change_income_address (0.91) · excluded=add_household_member (0.58, not_in_menu_config)',
      status: 'open',
      createdAt: '2026-09-09T06:02:00Z',
    },
  ],
};
