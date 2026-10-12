import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { auditRunsApi } from '@/api/backend/services';
import { queryKeys } from '@/api/queryKeys';

export const RUN_PROGRESS_POLL_MS = 10_000;

/** Polls `GET /audit-runs/{id}/progress` every 10s until the run reports `done`. */
export function useRunProgress(runId: string | undefined) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.runs.progress(runId ?? ''),
    queryFn: () => auditRunsApi.progress(runId as string),
    enabled: Boolean(runId),
    refetchInterval: (q) => (q.state.data?.done ? false : RUN_PROGRESS_POLL_MS),
    staleTime: 0,
  });

  // Once the run finishes, the run list/history is out of date — refresh it.
  const done = query.data?.done === true;
  useEffect(() => {
    if (done) void queryClient.invalidateQueries({ queryKey: queryKeys.admin.scheduler });
  }, [done, queryClient]);

  return query;
}
