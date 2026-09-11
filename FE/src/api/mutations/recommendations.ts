import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import type { ReviewDecision } from '@/types/domain';

interface RecordRecommendationDecisionInput extends ReviewDecision {
  recommendationId: string;
}

interface RecommendationDecisionResult {
  id: string;
  status: string;
  routedTo: string;
}

/**
 * Records a decision on a recommendation — a drafted content-gap answer, an
 * intent-merge suggestion, a new-flow proposal, or a prompt-change suggestion
 * (CC-P1-006/014/015/018/019).
 *
 * Approving never edits the live intent library directly (BRD 6.4): the mock
 * sets the recommendation's status to `routed` and records where it went,
 * mirroring `useRecordDecision` for findings — same vocabulary, same rule.
 */
export function useRecordRecommendationDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recommendationId, decision, comment }: RecordRecommendationDecisionInput) =>
      api.post<RecommendationDecisionResult>(`/recommendations/${recommendationId}/decision`, {
        decision,
        comment,
      }),

    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.recommendations.all });
      // Some recommendations are the drafted answer behind an unanswered
      // topic — refresh that list too so its status stays in sync.
      void queryClient.invalidateQueries({ queryKey: queryKeys.reports.unanswered });
    },
  });
}
