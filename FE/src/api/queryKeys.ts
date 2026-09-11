/**
 * Central TanStack Query key registry. Keeping keys here makes invalidation
 * after a review decision explicit — approving a finding has to refresh the
 * queue, the dashboard counts, and the run's findings total at once.
 */

export const queryKeys = {
  session: ['session'] as const,
  appContext: ['app-context'] as const,

  dashboard: {
    summary: ['dashboard', 'summary'] as const,
    findingsByType: ['dashboard', 'findings-by-type'] as const,
  },

  queue: {
    all: ['queue'] as const,
    list: (filters: Record<string, unknown>) => ['queue', 'list', filters] as const,
    item: (findingId: string) => ['queue', 'item', findingId] as const,
  },

  turns: {
    all: ['turns'] as const,
    detail: (turnId: string) => ['turns', 'detail', turnId] as const,
  },

  runs: {
    all: ['runs'] as const,
    list: ['runs', 'list'] as const,
    detail: (runId: string) => ['runs', 'detail', runId] as const,
  },

  recommendations: {
    all: ['recommendations'] as const,
    list: (filters: Record<string, unknown>) => ['recommendations', 'list', filters] as const,
  },

  reports: {
    summary: ['reports', 'summary'] as const,
    trends: ['reports', 'trends'] as const,
    unanswered: ['reports', 'unanswered'] as const,
  },

  admin: {
    users: ['admin', 'users'] as const,
    accessLog: ['admin', 'access-log'] as const,
    config: ['admin', 'config'] as const,
    configVersions: ['admin', 'config', 'versions'] as const,
    scheduler: ['admin', 'scheduler'] as const,
  },
} as const;
