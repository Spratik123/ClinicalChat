import { adminUsersApi, auditConfigApi, auditRunsApi, dashboardApi, findingsApi } from './services';
import { DECIDED_STATUSES, OPEN_STATUSES, type RunLookup } from './findingMappers';
import type { AuditRunResponse, BackendRunStatus, FindingResponse, UserResponse } from './types';

/**
 * Shared fetchers for data the UI needs in several shapes. TanStack Query
 * dedupes by key, so screens call these through a single cached query rather
 * than each fetching on their own.
 */

const RUN_STATUSES: BackendRunStatus[] = ['queued', 'running', 'completed', 'partial', 'failed', 'cancelled'];

/**
 * `GET /findings` insists on a `run_id` or `status`, so the full set is the
 * union of one query per status. Unknown statuses simply return an empty list.
 */
export async function fetchAllFindings(): Promise<FindingResponse[]> {
  const statuses = [...OPEN_STATUSES, ...DECIDED_STATUSES];
  const results = await Promise.all(statuses.map((status) => findingsApi.list({ status })));

  const byId = new Map<string, FindingResponse>();
  for (const result of results) for (const finding of result.findings) byId.set(finding.finding_id, finding);
  return [...byId.values()];
}

/** `GET /audit-runs` likewise requires a status, so query each. Newest window first. */
export async function fetchAllRuns(limit = 100): Promise<AuditRunResponse[]> {
  const results = await Promise.all(RUN_STATUSES.map((status) => auditRunsApi.list({ status, limit })));
  return results.flatMap((result) => result.runs).sort((a, b) => Date.parse(b.window_until) - Date.parse(a.window_until));
}

export function toRunLookup(runs: AuditRunResponse[]): RunLookup {
  return new Map(runs.map((run) => [run.run_id, run]));
}

/**
 * Best-effort user directory (`GET /admin/users` needs USER_READ). Callers
 * fall back to "User #id" when it is not available to the signed-in role.
 */
export async function fetchUserDirectory(): Promise<Map<number, UserResponse>> {
  try {
    const result = await adminUsersApi.list({ limit: 100 });
    return new Map(result.items.map((user) => [user.user_id, user]));
  } catch {
    return new Map();
  }
}

/** Per-run spend cap (USD) from each distinct config version, keyed `configId#version`. */
export async function fetchRunCostCaps(runs: AuditRunResponse[]): Promise<Map<string, number>> {
  const keys = [...new Set(runs.map((run) => `${run.config_id}#${run.config_version_number}`))];
  const entries = await Promise.all(
    keys.map(async (key): Promise<[string, number]> => {
      const [configId, version] = key.split('#');
      try {
        const config = await auditConfigApi.version(configId!, Number(version));
        return [key, Number(config.cost_caps.max_usd_per_run ?? 0) || 0];
      } catch {
        return [key, 0];
      }
    }),
  );
  return new Map(entries);
}

/** Run spend/findings rollups; a run whose rollup fails just shows no cost. */
export async function fetchRunDashboards(runs: AuditRunResponse[]) {
  const entries = await Promise.all(
    runs.map(async (run) => {
      try {
        return [run.run_id, await dashboardApi.run(run.run_id)] as const;
      } catch {
        return [run.run_id, undefined] as const;
      }
    }),
  );
  return new Map(entries);
}
