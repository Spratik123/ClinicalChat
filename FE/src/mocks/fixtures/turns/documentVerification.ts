import type { ConversationTurn } from '@/types/domain';

/**
 * Document turn covering both halves of CC-P1-011: extraction quality *and*
 * verification-rule logic.
 *
 * The BRD (8.3) calls out exactly this class of bug — "a document dated April
 * 2026 checked against a June 2026 system date". Here the rule compares the
 * pay-period end against the *system* date instead of the *application filing*
 * date, so a document that was valid when submitted is rejected. The extraction
 * was also degraded by a blurry photo, which is a separate finding.
 */
export const documentVerificationTurn: ConversationTurn = {
  id: 'T-88177',
  participantHash: 'ptc_7bd104af',
  occurredAt: '2026-09-08T12:06:44Z',
  transcript: [
    {
      id: 'msg_1',
      direction: 'outbound',
      who: 'bot',
      text: 'Next, please send a photo of your most recent pay stub.',
      at: '2026-09-08T12:05:50Z',
    },
    {
      id: 'msg_2',
      direction: 'inbound',
      who: 'user',
      text: '[image attached: paystub.jpg]',
      at: '2026-09-08T12:06:44Z',
      contentType: 'image/jpeg',
      messageType: 'media',
    },
    {
      id: 'msg_3',
      direction: 'outbound',
      who: 'bot',
      text: "Thanks. That pay stub is more than 60 days old, so we can't use it. Please send a pay stub from the last 60 days.",
      at: '2026-09-08T12:06:51Z',
    },
    {
      id: 'msg_4',
      direction: 'inbound',
      who: 'user',
      text: 'thats the only one i have i only work seasonal',
      at: '2026-09-08T12:07:30Z',
    },
  ],
  flow: { flowType: 'survey_income_verification', subFlow: 'survey_response', correct: true },
  matchedIntents: [
    { rank: 1, name: 'survey_document_upload_received', confidence: 0.94, selected: true, rankingCorrect: true },
    { rank: 2, name: 'income_verification_paystub_too_old', confidence: 0.71, selected: false, rankingCorrect: true },
  ],
  catalog: {
    libraryVersion: 'v128',
    snapshotId: 'snap_2026-08-29T02:00Z',
    bestCatalogMatch: 'survey_document_upload_received',
  },
  survey: {
    surveyName: 'income_verification',
    stage: 'survey_response',
    questionKey: 'monthly_income_proof',
    handledCorrectly: true,
    notes: 'Upload accepted and acknowledged; the failure is downstream in the verification rule.',
  },
  documents: [
    {
      id: 'DOC-3391',
      // Never a raw S3 URL — a short-lived, access-logged reference.
      assetRef: 'asset_ref_5f21c9a8',
      mimeType: 'image/jpeg',
      legibility: 'degraded',
      extractedValues: {
        employer: 'Front Range Harvest LLC',
        gross_pay: 1284.5,
        pay_period_end: '2026-04-15',
        pay_frequency: 'biweekly',
        ytd_gross: null,
      },
      verificationRules: [
        {
          rule: 'paystub_within_60_days_of_application',
          outcome: 'fail',
          // The rule ran correctly but is itself wrong — the distinction the
          // BRD insists the audit must make.
          ruleCorrect: false,
          detail:
            'Compared pay_period_end 2026-04-15 against the system date 2026-09-08 (146 days). The application was filed 2026-05-02, which places the document 17 days inside the window. The rule uses the wrong reference date.',
        },
        {
          rule: 'gross_pay_present',
          outcome: 'pass',
          ruleCorrect: true,
        },
        {
          rule: 'ytd_gross_present',
          outcome: 'inconclusive',
          ruleCorrect: true,
          detail: 'Field not legible in the source image; rule correctly declined to assert a value.',
        },
      ],
    },
  ],
  rawTrace: {
    trace_schema: 'langgraph.v4',
    survey_context: { name: 'income_verification', question: 'monthly_income_proof', attempt: 1 },
    extraction: {
      engine: 'textract+bedrock',
      confidence_mean: 0.62,
      low_confidence_fields: ['ytd_gross', 'pay_period_end'],
      image_quality: { blur_score: 0.71, glare: true, cropped: false },
    },
    verification: {
      ruleset_version: 'rules_2026_07',
      reference_date_source: 'system_clock',
      results: [{ rule: 'paystub_within_60_days_of_application', passed: false, delta_days: 146 }],
    },
  },
  findings: [
    {
      id: 'FND-51111',
      turnId: 'T-88177',
      runId: 'RUN-2091',
      type: 'verification_rule_error',
      severity: 'high',
      owner: 'engineering',
      title: 'Verification rule used the wrong reference date',
      summary:
        'The 60-day pay-stub rule compares against the system clock rather than the application filing date. A document that was inside the window when submitted is rejected, which can push a participant toward a procedural denial.',
      evidence:
        'reference_date_source=system_clock · pay_period_end=2026-04-15 · application_filed=2026-05-02 · delta_days=146 (should be 17) · ruleset=rules_2026_07',
      status: 'open',
      createdAt: '2026-09-09T06:02:00Z',
    },
    {
      id: 'FND-51110',
      turnId: 'T-88177',
      runId: 'RUN-2091',
      type: 'document_extraction',
      severity: 'medium',
      owner: 'content',
      title: 'Degraded extraction — blurry pay stub',
      summary:
        'The source image is blurred with glare. ytd_gross could not be read and pay_period_end was extracted at low confidence, which the verification rule then treated as authoritative.',
      evidence: 'blur_score=0.71 · glare=true · confidence_mean=0.62 · low_confidence_fields=[ytd_gross, pay_period_end]',
      status: 'open',
      createdAt: '2026-09-09T06:02:00Z',
    },
  ],
};
