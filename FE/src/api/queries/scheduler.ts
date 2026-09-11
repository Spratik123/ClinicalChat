import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import type { AuditRun, ScheduledJob } from '@/types/domain';

interface SchedulerResponse {
  job: ScheduledJob;
  runs: AuditRun[];
}

export function useScheduler() {
  return useQuery({
    queryKey: queryKeys.admin.scheduler,
    queryFn: () => api.get<SchedulerResponse>('/admin/scheduler'),
    // Batches move in the background; a stale "in progress" card would be
    // actively misleading, so this refreshes more eagerly than most queries.
    staleTime: 15_000,
  });
}
