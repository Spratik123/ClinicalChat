import { http, HttpResponse, delay } from 'msw';
import { env } from '@/config/env';
import { findRecommendation, mockRecommendations, mockReportSummary, mockTrends, mockUnanswered } from './fixtures/audit';
import type { ReviewStatus } from '@/types/domain';

/**
 * Mock layer for the routes the backend does not serve yet: recommendations
 * and reports. Everything else — auth, password reset, users, audit config,
 * runs, findings, dashboard — goes to the real API.
 */

const base = env.apiBaseUrl.replace(/\/$/, '');
const url = (path: string) => `${base}${path}`;

type RecordedDecisionKind = 'approve' | 'request_changes' | 'reject';

/**
 * Approving does not edit anything in the live bot — it routes the item to its
 * owner for action (BRD 6.4, FR-ROUTE-001/002).
 */
const statusForDecision: Record<RecordedDecisionKind, ReviewStatus> = {
  approve: 'routed',
  request_changes: 'changes_requested',
  reject: 'rejected',
};

export const handlers = [
  /* ------------------------ Recommendations ------------------------ */

  http.get(url('/recommendations'), async () => {
    await delay(250);
    return HttpResponse.json({ items: mockRecommendations, total: mockRecommendations.length });
  }),

  http.post(url('/recommendations/:id/decision'), async ({ request, params }) => {
    await delay(300);
    const { decision, comment } = (await request.json()) as {
      decision?: RecordedDecisionKind;
      comment?: string;
    };

    // A comment is mandatory — it feeds the HIPAA/SOC-2 audit log (BRD 11),
    // same as a finding decision.
    if (!comment?.trim()) {
      return HttpResponse.json({ message: 'A comment is required to record a decision.' }, { status: 400 });
    }
    if (!decision || !(decision in statusForDecision)) {
      return HttpResponse.json({ message: 'Unknown decision.' }, { status: 400 });
    }

    const recommendation = findRecommendation(String(params.id));
    if (!recommendation) return HttpResponse.json({ message: 'Recommendation not found.' }, { status: 404 });

    const resultingStatus = statusForDecision[decision];
    // Mutating the fixture is what makes the flow demonstrable — same pattern
    // as the finding-decision handler above.
    recommendation.status = resultingStatus;
    if (resultingStatus === 'routed') {
      recommendation.routedTo = recommendation.owner === 'engineering' ? 'Engineering backlog' : 'Content workflow / CMS';
      recommendation.routedAt = new Date().toISOString();

      // A content-gap recommendation is the drafted answer behind an
      // unanswered topic — once it's routed, the topic it came from is no
      // longer just "drafted", it's shipped.
      const topic = mockUnanswered.find((candidate) => candidate.recommendationId === recommendation.id);
      if (topic) topic.status = 'routed';
    }

    return HttpResponse.json({
      id: recommendation.id,
      status: resultingStatus,
      routedTo: recommendation.owner,
    });
  }),

  /* ---------------------------- Reports ---------------------------- */

  http.get(url('/reports/summary'), async () => {
    await delay(200);
    return HttpResponse.json(mockReportSummary);
  }),

  http.get(url('/reports/trends'), async () => {
    await delay(200);
    return HttpResponse.json(mockTrends);
  }),

  http.get(url('/reports/unanswered'), async () => {
    await delay(200);
    return HttpResponse.json(mockUnanswered);
  }),

];
