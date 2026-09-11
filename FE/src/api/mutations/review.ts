import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import type { DecisionResult, ReviewDecision } from '@/types/domain';

interface RecordDecisionInput extends ReviewDecision {
  findingId: string;
  /** Used to refresh the turn the finding belongs to. */
  turnId: string;
}

/**
 * Records a review decision against a finding.
 *
 * Approving does not edit the live bot — it routes the finding to its owner
 * (BRD 6.4, FR-ROUTE-001/002). One decision changes the queue, the turn, the
 * dashboard counters, and the rail badge, so all four are invalidated together.
 */
export function useRecordDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ findingId, decision, comment }: RecordDecisionInput) =>
      api.post<DecisionResult>(`/findings/${findingId}/decision`, { decision, comment }),

    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.queue.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.turns.detail(variables.turnId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.findingsByType });
      void queryClient.invalidateQueries({ queryKey: queryKeys.appContext });
    },
  });
}

/**
 * Assigns the current reviewer to a queue item, which is what turns "Needs
 * review" into "In review" (CC-P1-017). Deliberately assign-to-self only —
 * picking a colleague from a full user directory is a bigger control than
 * this pass needs; the queue-card and drawer "Assign" buttons both just claim
 * the item for whoever clicks them.
 */
export function useAssignToSelf() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ findingId, assignee }: { findingId: string; assignee: string }) =>
      api.post<{ findingId: string; assignee: string }>(`/queue/${findingId}/assign`, { assignee }),

    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.queue.all });
    },
  });
}
