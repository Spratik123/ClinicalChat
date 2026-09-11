import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import type { AppContext, AuditRun, DashboardSummary, FindingTypeCount } from '@/types/domain';

export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.dashboard.summary,
    queryFn: () => api.get<DashboardSummary>('/dashboard/summary'),
  });
}

export function useFindingsByType() {
  return useQuery({
    queryKey: queryKeys.dashboard.findingsByType,
    queryFn: () => api.get<FindingTypeCount[]>('/dashboard/findings-by-type'),
  });
}

export function useRecentRuns(limit = 4) {
  return useQuery({
    queryKey: [...queryKeys.runs.list, limit],
    queryFn: () => api.get<{ items: AuditRun[] }>('/runs', { query: { limit } }),
    select: (data) => data.items.slice(0, limit),
  });
}

/**
 * Chrome-level context for the side rail badge and top-bar crumb.
 *
 * Loaded once for the whole shell rather than per screen; TanStack Query
 * dedupes it, so the dashboard does not fetch it a second time.
 */
export function useAppContext() {
  return useQuery({
    queryKey: queryKeys.appContext,
    queryFn: () => api.get<AppContext>('/app/context'),
    // Queue depth changes as reviewers work, so keep this fresher than the
    // batch-produced audit data.
    staleTime: 30_000,
  });
}
