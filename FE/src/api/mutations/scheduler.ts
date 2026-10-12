import { useMutation, useQueryClient } from '@tanstack/react-query';
import { auditRunsApi } from '@/api/backend/services';
import type { BudgetApprovalRequest, TriggerAuditRunRequest } from '@/api/backend/types';
import { queryKeys } from '@/api/queryKeys';

function invalidateSchedulerAndRuns(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.admin.scheduler });
  void queryClient.invalidateQueries({ queryKey: queryKeys.runs.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.queue.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
}

/**
 * Starts an ad-hoc run (FR-ENG-001's manual-trigger path). The backend needs an
 * explicit audit window and library when no schedule is named, and the run
 * spends Bedrock budget up to the config's per-run cap.
 */
export function useCreateRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TriggerAuditRunRequest) => auditRunsApi.trigger(input),
    onSuccess: () => invalidateSchedulerAndRuns(queryClient),
  });
}

/** Approves or declines a held run's spend past the per-message cap. */
export function useBudgetApproval(runId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BudgetApprovalRequest) => auditRunsApi.budgetApproval(runId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.runs.progress(runId) });
      invalidateSchedulerAndRuns(queryClient);
    },
    // A 409 means the run's state moved on (already decided / not waiting); re-read it.
    onError: () => void queryClient.invalidateQueries({ queryKey: queryKeys.runs.progress(runId) }),
  });
}

/** Retries the failed turns of a partial or failed run as a new linked run. */
export function useRetryRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (runId: string) => auditRunsApi.retry(runId),
    onSuccess: () => invalidateSchedulerAndRuns(queryClient),
  });
}
