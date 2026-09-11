import type { FindingType, Severity } from '@/types/domain';
import { findingTypeMeta } from '@/config/findingTypes';

/**
 * Queue filters live in the URL, not in a store.
 *
 * A filtered queue is then linkable and shareable — a reviewer can hand a
 * colleague "the 18 response mismatches", the dashboard can deep-link into a
 * finding type, and the back button behaves. Everything here is derived from
 * `useSearchParams`.
 */
export interface QueueFilterState {
  findingTypes: FindingType[];
  severities: Severity[];
  safetyOnly: boolean;
  search: string;
  /**
   * `undefined` — the default worklist tab: open items only, fixed priority
   * order. `'decided'` — the "Recently reviewed" tab: everything already
   * acted on, newest decision first. `'all'` — open and decided together
   * (used by a narrowing filter that should search across both, not a tab).
   */
  status: 'all' | 'decided' | undefined;
}

const validFindingTypes = new Set(Object.keys(findingTypeMeta));
const validSeverities = new Set<string>(['safety', 'high', 'medium', 'low']);

function parseStatus(raw: string | null): QueueFilterState['status'] {
  if (raw === 'all') return 'all';
  if (raw === 'decided') return 'decided';
  return undefined;
}

export function parseQueueParams(params: URLSearchParams): QueueFilterState {
  return {
    findingTypes: params.getAll('findingType').filter((value): value is FindingType => validFindingTypes.has(value)),
    severities: params.getAll('severity').filter((value): value is Severity => validSeverities.has(value)),
    safetyOnly: params.get('safetyOnly') === 'true',
    search: params.get('search') ?? '',
    status: parseStatus(params.get('status')),
  };
}

export function toSearchParams(filters: QueueFilterState): URLSearchParams {
  const params = new URLSearchParams();
  filters.findingTypes.forEach((type) => params.append('findingType', type));
  filters.severities.forEach((severity) => params.append('severity', severity));
  if (filters.safetyOnly) params.set('safetyOnly', 'true');
  if (filters.search.trim()) params.set('search', filters.search.trim());
  if (filters.status) params.set('status', filters.status);
  return params;
}

export const emptyQueueFilters: QueueFilterState = {
  findingTypes: [],
  severities: [],
  safetyOnly: false,
  search: '',
  status: undefined,
};

/**
 * True if any filter that NARROWS the result set is active — severity,
 * finding type, safety-only, or search. Deliberately excludes `status`:
 * switching tabs changes *which* set you're looking at rather than narrowing
 * the current one, so it needs different copy ("12 total" rather than
 * "3 of 8 open · filtered").
 */
export function hasNarrowingFilters(filters: QueueFilterState): boolean {
  return (
    filters.findingTypes.length > 0 ||
    filters.severities.length > 0 ||
    filters.safetyOnly ||
    filters.search.trim().length > 0
  );
}

/** True if anything is off the default view — narrowing filters, or a non-default tab. Drives "Clear filters" visibility. */
export function hasActiveFilters(filters: QueueFilterState): boolean {
  return hasNarrowingFilters(filters) || filters.status !== undefined;
}
