import type { AuditRun } from '@/types/domain';

const terminalStatuses = new Set(['succeeded', 'partial', 'failed']);

function durationMinutes(run: AuditRun): number | null {
  if (!run.completedAt) return null;
  return (Date.parse(run.completedAt) - Date.parse(run.startedAt)) / 60_000;
}

/**
 * Average batch duration, plus a recent-vs-prior comparison — split the
 * completed runs (newest first, as the API returns them) into two halves and
 * compare. Only meaningful with a handful of runs; returns `null` for the
 * comparison when there isn't a clean second half to compare against.
 */
export function computeAverageDuration(runs: AuditRun[]): { avgMinutes: number; deltaMinutes: number | null } {
  const completed = runs.filter((run) => terminalStatuses.has(run.status));
  const durations = completed.map(durationMinutes).filter((value): value is number => value !== null);

  const avg = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

  if (durations.length === 0) return { avgMinutes: 0, deltaMinutes: null };

  const half = Math.floor(durations.length / 2);
  if (half === 0) return { avgMinutes: avg(durations), deltaMinutes: null };

  const recent = durations.slice(0, half);
  const prior = durations.slice(half, half * 2);

  return {
    avgMinutes: avg(durations),
    // Positive means runs are getting faster.
    deltaMinutes: avg(prior) - avg(recent),
  };
}
