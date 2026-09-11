import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import type { AuditRun, ScheduledJob } from '@/types/domain';

function invalidateSchedulerAndRuns(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.admin.scheduler });
  void queryClient.invalidateQueries({ queryKey: queryKeys.runs.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
}

/** Pauses a running batch. Does not touch anything already decided in its findings — pausing only stops further engine processing. */
export function usePauseRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (runId: string) => api.post<AuditRun>(`/runs/${runId}/pause`),
    onSuccess: () => invalidateSchedulerAndRuns(queryClient),
  });
}

export function useResumeRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (runId: string) => api.post<AuditRun>(`/runs/${runId}/resume`),
    onSuccess: () => invalidateSchedulerAndRuns(queryClient),
  });
}

/**
 * Starts an ad-hoc run (FR-ENG-001's manual-trigger path) using the currently
 * active audit configuration and its cost cap — the same governance a
 * scheduled run gets, not a separate ungoverned path.
 */
export function useCreateRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<AuditRun>('/runs'),
    onSuccess: () => invalidateSchedulerAndRuns(queryClient),
  });
}

/** Turns the recurring nightly job on/off. Does not affect a batch already in progress. */
export function useToggleSchedulerJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (active: boolean) => api.patch<ScheduledJob>('/admin/scheduler/job', { active }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.scheduler });
    },
  });
}
