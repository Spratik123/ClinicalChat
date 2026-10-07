import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminUsersApi, auditConfigApi, dashboardApi } from '@/api/backend/services';
import { fetchAllRuns, fetchRunCostCaps, fetchRunDashboards } from '@/api/backend/data';
import { toAuditRun, toFinding, toFindingType, isOpenStatus } from '@/api/backend/findingMappers';
import { ensureQueueSource } from '@/api/queries/queue';
import { queryKeys } from '@/api/queryKeys';
import { findingTypeMeta } from '@/config/findingTypes';
import type { AppContext, AuditRun, DashboardSummary, FindingOwner, FindingTypeCount, OnboardingStep } from '@/types/domain';

/** A finished run is the one the dashboard calls "last run"; queued/running ones are not done yet. */
const FINISHED = new Set(['completed', 'partial', 'failed']);

/** Builds UI runs with spend and cap attached; failures in the extras just leave them at zero. */
export async function loadAuditRuns(limit?: number): Promise<AuditRun[]> {
  const raw = (await fetchAllRuns()).slice(0, limit);
  const [dashboards, caps] = await Promise.all([fetchRunDashboards(raw), fetchRunCostCaps(raw)]);

  return raw.map((run) =>
    toAuditRun(run, {
      dashboard: dashboards.get(run.run_id),
      costCapUsd: caps.get(`${run.config_id}#${run.config_version_number}`),
    }),
  );
}

export function useDashboardSummary() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.dashboard.summary,
    queryFn: async (): Promise<DashboardSummary> => {
      const [summary, source] = await Promise.all([dashboardApi.summary(), ensureQueueSource(queryClient)]);

      const open = source.findings.filter((finding) => isOpenStatus(finding.status)).map((f) => toFinding(f, source.runs));
      const byOwner = (owner: FindingOwner) => open.filter((finding) => finding.owner === owner).length;

      const lastRaw = [...source.runs.values()]
        .filter((run) => FINISHED.has(run.status))
        .sort((a, b) => Date.parse(b.window_until) - Date.parse(a.window_until))[0];

      let lastRun: AuditRun | null = null;
      if (lastRaw) {
        const [dashboards, caps] = await Promise.all([fetchRunDashboards([lastRaw]), fetchRunCostCaps([lastRaw])]);
        lastRun = toAuditRun(lastRaw, {
          dashboard: dashboards.get(lastRaw.run_id),
          costCapUsd: caps.get(`${lastRaw.config_id}#${lastRaw.config_version_number}`),
        });
      }

      const safetyOpen = (summary.open_by_severity.critical ?? 0) || open.filter((f) => f.severity === 'safety').length;

      return {
        lastRun,
        findingsThisPeriod: source.findings.length,
        safetyFindingsOpen: safetyOpen,
        queueDepth: summary.open_findings_total,
        queueBreakdown: { safety: byOwner('safety'), content: byOwner('content'), engineering: byOwner('engineering') },
        onboarding: await buildOnboarding(summary.open_findings_total, safetyOpen),
      };
    },
  });
}

/** Each step is best-effort: a role that cannot read users/config simply sees that step as pending. */
async function buildOnboarding(queueDepth: number, safetyOpen: number): Promise<OnboardingStep[]> {
  const [users, configs] = await Promise.all([
    adminUsersApi.list({ limit: 100 }).catch(() => null),
    auditConfigApi.list().catch(() => null),
  ]);

  const activeUsers = users?.items.filter((user) => user.status === 'active').length ?? 0;
  const totalUsers = users?.items.length ?? 0;

  return [
    {
      id: 'invite_team',
      complete: activeUsers > 1,
      detail: users ? `${activeUsers} of ${totalUsers} users active` : 'Visible to admins',
    },
    {
      id: 'set_configuration',
      complete: (configs?.length ?? 0) > 0,
      detail: configs ? `${configs.length} configuration${configs.length === 1 ? '' : 's'}` : 'Visible to admins',
    },
    {
      id: 'work_queue',
      complete: queueDepth === 0,
      detail: queueDepth === 0 ? 'Queue clear' : `${queueDepth} items waiting, ${safetyOpen} safety-critical`,
    },
  ];
}

export function useFindingsByType() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.dashboard.findingsByType,
    queryFn: async (): Promise<FindingTypeCount[]> => {
      const source = await ensureQueueSource(queryClient);
      const counts = new Map<string, number>();
      for (const finding of source.findings) counts.set(finding.finding_type, (counts.get(finding.finding_type) ?? 0) + 1);

      return [...counts.entries()].map(([backendType, count]) => {
        const type = toFindingType(backendType);
        const meta = findingTypeMeta[type];
        return { type, label: meta.label, owner: meta.owner, count, safetyCritical: meta.safetyCritical };
      });
    },
  });
}

export function useRecentRuns(limit = 4) {
  return useQuery({
    queryKey: [...queryKeys.runs.list, limit],
    queryFn: () => loadAuditRuns(limit),
  });
}

/**
 * Chrome-level context for the side rail badge and top-bar crumb.
 *
 * Loaded once for the whole shell rather than per screen; TanStack Query
 * dedupes it, so the dashboard does not fetch it a second time.
 */
export function useAppContext() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.appContext,
    queryFn: async (): Promise<AppContext> => {
      const source = await ensureQueueSource(queryClient);
      const open = source.findings.filter((finding) => isOpenStatus(finding.status));

      const latest = [...source.runs.values()].sort((a, b) => Date.parse(b.window_until) - Date.parse(a.window_until))[0];
      const snapshot = latest?.library_snapshot_id ?? '';

      return {
        library: {
          version: snapshot.split('#')[0] || '—',
          pulledAt: latest?.window_until ?? new Date(0).toISOString(),
        },
        queueDepth: open.length,
        safetyFindingsOpen: open.filter((finding) => toFinding(finding, source.runs).severity === 'safety').length,
      };
    },
    // Queue depth changes as reviewers work, so keep this fresher than the
    // batch-produced audit data.
    staleTime: 30_000,
  });
}
