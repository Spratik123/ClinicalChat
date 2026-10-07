import { useQuery } from '@tanstack/react-query';
import { schedulesApi } from '@/api/backend/services';
import type { AuditScheduleResponse } from '@/api/backend/types';
import { loadAuditRuns } from '@/api/queries/dashboard';
import { queryKeys } from '@/api/queryKeys';
import type { AuditRun, RunCadence, ScheduledJob } from '@/types/domain';

interface SchedulerResponse {
  job: ScheduledJob;
  runs: AuditRun[];
}

/** Coarse cadence from an EventBridge `cron(min hour dom month dow year)` / `rate(...)` expression. */
function cadenceFor(expression: string): RunCadence {
  const hourField = expression.match(/^cron\(\S+\s+(\S+)/)?.[1];
  if (hourField?.includes(',') || hourField?.includes('/')) return 'twelve_hourly';
  if (/^rate\(12 hours?\)$/.test(expression)) return 'twelve_hourly';
  return 'nightly';
}

/** The backend can hold several audit schedules; the UI shows the first enabled one (or the first). */
function toScheduledJob(schedules: AuditScheduleResponse[]): ScheduledJob {
  const schedule = schedules.find((candidate) => candidate.is_enabled) ?? schedules[0];

  if (!schedule) {
    return { id: 'none', name: 'No schedule', active: false, cadence: 'manual', nextRunAt: null, timezone: 'UTC' };
  }

  return {
    id: schedule.schedule_id,
    name: schedule.schedule_id,
    active: schedule.is_enabled,
    cadence: cadenceFor(schedule.cron_expression),
    // The API reports neither the next fire time nor a timezone (EventBridge cron is UTC).
    nextRunAt: null,
    timezone: 'UTC',
  };
}

export function useScheduler() {
  return useQuery({
    queryKey: queryKeys.admin.scheduler,
    queryFn: async (): Promise<SchedulerResponse> => {
      const [schedules, runs] = await Promise.all([schedulesApi.listAudit(), loadAuditRuns()]);
      return { job: toScheduledJob(schedules), runs };
    },
    // Batches move in the background; a stale "in progress" card would be
    // actively misleading, so this refreshes more eagerly than most queries.
    staleTime: 15_000,
  });
}
