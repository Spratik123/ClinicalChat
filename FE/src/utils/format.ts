import { format, formatDistanceToNowStrict, isTomorrow, isToday, parseISO } from 'date-fns';

/** `1842` → `1,842` */
export function formatCount(value: number): string {
  return value.toLocaleString('en-US');
}

/** `4.1` → `$4.10` */
export function formatUsd(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

/** `0.88` → `0.88` — confidences stay two-decimal so they compare cleanly. */
export function formatConfidence(value: number): string {
  return value.toFixed(2);
}

/** `0.914` → `91.4%` — for a 0-1 fraction. */
export function formatPercent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

/** `91.4` → `91.4%` — for a value already expressed on a 0-100 scale (e.g. `ReportSummary.parityPct`). */
export function formatPercentPoints(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

/** `2026-09-09T06:02:00Z` → `6:02 AM` */
export function formatTime(iso: IsoLike): string {
  return format(toDate(iso), 'h:mm a');
}

/** `2026-09-09T06:02:00Z` → `Sep 9, 6:02 AM` */
export function formatDateTime(iso: IsoLike): string {
  return format(toDate(iso), 'MMM d, h:mm a');
}

/** `2026-08-29T00:00:00Z` → `Aug 29, 2026` */
export function formatDate(iso: IsoLike): string {
  return format(toDate(iso), 'MMM d, yyyy');
}

/** `2026-09-09T06:02:00Z` → `40 minutes ago` */
export function formatRelative(iso: IsoLike): string {
  return `${formatDistanceToNowStrict(toDate(iso))} ago`;
}

/** Compact age for dense tables: `2h`, `3d`. */
export function formatAge(iso: IsoLike): string {
  return formatDistanceToNowStrict(toDate(iso))
    .replace(/ (seconds?|minutes?|hours?|days?|months?|years?)$/, (_, unit: string) => unit[0]!)
    .replace(/\s/g, '');
}

/**
 * `2026-09-11T05:00:00Z` → `Today · 11:00 PM` / `Tomorrow · 11:00 PM` / `Sep 12 · 11:00 PM`.
 *
 * Rendered in the viewer's local timezone, same simplification as the rest of
 * the app (see the README's timestamp-timezone note) — the stored IANA zone
 * on `ScheduledJob` isn't converted to, just displayed alongside as a label.
 */
export function formatDayTime(iso: IsoLike): string {
  const date = toDate(iso);
  const day = isToday(date) ? 'Today' : isTomorrow(date) ? 'Tomorrow' : format(date, 'MMM d');
  return `${day} · ${format(date, 'h:mm a')}`;
}

/** `138` (minutes) → `2h 18m` */
export function formatDurationMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

/** `survey_income_verification` → `Survey income verification` */
export function humanizeFlowType(flowType: string): string {
  const words = flowType.split('_').filter(Boolean);
  if (words.length === 0) return flowType;
  return [words[0]![0]!.toUpperCase() + words[0]!.slice(1), ...words.slice(1)].join(' ');
}

type IsoLike = string | Date;

function toDate(iso: IsoLike): Date {
  return iso instanceof Date ? iso : parseISO(iso);
}
