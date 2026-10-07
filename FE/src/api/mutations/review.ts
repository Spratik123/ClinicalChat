import { useMutation, useQueryClient } from '@tanstack/react-query';
import { findingsApi } from '@/api/backend/services';
import { toFinding, toReviewStatus } from '@/api/backend/findingMappers';
import { queryKeys } from '@/api/queryKeys';
import { useAuth } from '@/auth/useAuth';
import { findingTypeMeta } from '@/config/findingTypes';
import type { DecisionResult, ReviewDecision } from '@/types/domain';

interface RecordDecisionInput extends ReviewDecision {
  findingId: string;
  /** Used to refresh the turn the finding belongs to. */
  turnId: string;
}

/**
 * Records a review decision against a finding.
 *
 * The backend models a review as "does the reviewer agree with the audit?":
 *   approve          -> agree
 *   reject           -> disagree, finding is a false positive
 *   request changes  -> disagree, but not a false positive
 *
 * Writes are optimistic-concurrency guarded, so the current `version` is read
 * immediately before the write; a 409 means someone else got there first.
 *
 * Approving does not edit the live bot — it routes the finding to its owner
 * (BRD 6.4, FR-ROUTE-001/002). One decision changes the queue, the turn, the
 * dashboard counters, and the rail badge, so all of them are invalidated together.
 */
export function useRecordDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ findingId, decision, comment }: RecordDecisionInput): Promise<DecisionResult> => {
      const { finding } = await findingsApi.get(findingId);
      const updated = await findingsApi.review(findingId, {
        agree: decision === 'approve',
        is_false_positive: decision === 'reject',
        comment,
        expected_version: finding.version,
      });

      const mapped = toFinding(updated, new Map());
      return {
        findingId,
        status: toReviewStatus(updated.status),
        routedTo: mapped.owner ?? findingTypeMeta[mapped.type].owner,
      };
    },

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
 * Assigns the signed-in reviewer to a queue item, which is what turns "Needs
 * review" into "In review" (CC-P1-017). Deliberately assign-to-self only —
 * picking a colleague needs the user directory, which reviewers cannot read.
 */
export function useAssignToSelf() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ findingId }: { findingId: string }) => {
      if (!user) throw new Error('You need to be signed in to take a finding.');

      const { finding } = await findingsApi.get(findingId);
      const updated = await findingsApi.assign(findingId, {
        assignee_user_id: Number(user.id),
        expected_version: finding.version,
      });
      return { findingId, assignee: user.name, version: updated.version };
    },

    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.queue.all });
    },
  });
}
