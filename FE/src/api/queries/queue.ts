import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import { findingsApi } from '@/api/backend/services';
import { fetchAllFindings, fetchAllRuns, fetchUserDirectory, toRunLookup } from '@/api/backend/data';
import {
  compareQueueItems,
  isOpenStatus,
  toBackendFindingType,
  toConversationTurn,
  toQueueItem,
  toReviewDecisions,
  type RunLookup,
} from '@/api/backend/findingMappers';
import type { FindingResponse, UserResponse } from '@/api/backend/types';
import { queryKeys } from '@/api/queryKeys';
import { useAuth } from '@/auth/useAuth';
import type { QueueFilterState } from '@/features/queue/queueParams';
import type { QueueItem, QueueResponse, TurnDetail } from '@/types/domain';

/** Everything the queue, turn view and dashboard derive from, loaded once and shared. */
export interface QueueSource {
  findings: FindingResponse[];
  runs: RunLookup;
  users: ReadonlyMap<number, UserResponse>;
}

export async function loadQueueSource(): Promise<QueueSource> {
  const [findings, runs, users] = await Promise.all([fetchAllFindings(), fetchAllRuns(), fetchUserDirectory()]);
  return { findings, runs: toRunLookup(runs), users };
}

/** Reads the shared source, refetching only if what is cached is older than a few seconds. */
export function ensureQueueSource(queryClient: QueryClient): Promise<QueueSource> {
  return queryClient.fetchQuery({
    queryKey: queryKeys.queue.source,
    queryFn: loadQueueSource,
    staleTime: 5_000,
  });
}

export function useQueueSource() {
  return useQuery({ queryKey: queryKeys.queue.source, queryFn: loadQueueSource });
}

/** Resolves a backend user id to a display name, falling back to the signed-in user, then "User #id". */
function useNameResolver(users: ReadonlyMap<number, UserResponse> | undefined) {
  const { user } = useAuth();
  return (userId: number): string => {
    if (user && String(userId) === user.id) return user.name;
    const known = users?.get(userId);
    return known?.display_name?.trim() || known?.email?.split('@')[0] || `User #${userId}`;
  };
}

function applyFilters(items: QueueItem[], filters: QueueFilterState, findings: ReadonlyMap<string, FindingResponse>) {
  const search = filters.search.trim().toLowerCase();
  const backendTypes = new Set(filters.findingTypes.map(toBackendFindingType));

  return items.filter((item) => {
    if (filters.safetyOnly && !item.safetyCritical) return false;
    if (filters.severities.length > 0 && !filters.severities.includes(item.severity)) return false;
    if (backendTypes.size > 0 && !backendTypes.has(findings.get(item.findingId)?.finding_type ?? '')) return false;
    if (!search) return true;

    const raw = findings.get(item.findingId);
    return [item.turnId, item.findingId, item.findingLabel, item.signalQuote, raw?.user_message, raw?.bot_text]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(search);
  });
}

function isToday(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const date = new Date(iso);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

function medianAgeMinutes(items: QueueItem[]): number {
  if (items.length === 0) return 0;
  const now = Date.now();
  const ages = items.map((item) => (now - Date.parse(item.createdAt)) / 60_000).sort((a, b) => a - b);
  return ages[Math.floor(ages.length / 2)]!;
}

export function useQueue(filters: QueueFilterState) {
  const source = useQueueSource();
  const nameOf = useNameResolver(source.data?.users);

  return useQuery({
    queryKey: queryKeys.queue.source,
    queryFn: loadQueueSource,
    select: (data): QueueResponse => {
      const byId = new Map(data.findings.map((finding) => [finding.finding_id, finding]));
      const all = data.findings.map((finding) => toQueueItem(finding, data.runs, nameOf)).sort(compareQueueItems);
      const open = all.filter((item) => item.status === 'open');

      const scoped =
        filters.status === 'decided'
          ? all.filter((item) => item.status !== 'open')
          : filters.status === 'all'
            ? all
            : open;
      const items = applyFilters(scoped, filters, byId);

      return {
        items,
        total: items.length,
        totalOpen: open.length,
        totalSafety: open.filter((item) => item.safetyCritical).length,
        medianOpenAgeMinutes: medianAgeMinutes(open),
        decidedToday: data.findings.filter((finding) => !isOpenStatus(finding.status) && isToday(finding.resolved_at))
          .length,
        asOf: new Date().toISOString(),
      };
    },
  });
}

/**
 * A turn is the set of findings the audit raised against one conversation turn,
 * plus each finding's review trail. Its prev/next neighbours follow the queue's
 * own ordering so a reviewer can keep working without going back to the list.
 */
export function useTurn(turnId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.turns.detail(turnId ?? ''),
    enabled: Boolean(turnId),
    queryFn: async (): Promise<TurnDetail> => {
      const source = await ensureQueueSource(queryClient);
      const inTurn = source.findings.filter((finding) => finding.audit_turn_id === turnId);
      if (inTurn.length === 0) throw new ApiError(404, 'That turn has no findings.');

      // Fresh copies with their reviews; the list endpoint carries neither.
      const details = await Promise.all(inTurn.map((finding) => findingsApi.get(finding.finding_id)));
      const nameOf = (id: number) => {
        if (user && String(id) === user.id) return user.name;
        const known = source.users.get(id);
        return known?.display_name?.trim() || known?.email?.split('@')[0] || `User #${id}`;
      };

      const fresh = details.map((detail) => detail.finding);
      const turn = toConversationTurn(turnId!, fresh, details.map((detail) => detail.reviews), source.runs);

      const decisions = details.flatMap((detail) => toReviewDecisions(detail.finding, detail.reviews, nameOf));
      decisions.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

      const order = [
        ...new Set(
          source.findings
            .map((finding) => toQueueItem(finding, source.runs, nameOf))
            .filter((item) => item.status === 'open')
            .sort(compareQueueItems)
            .map((item) => item.turnId),
        ),
      ];
      const index = order.indexOf(turnId!);

      return {
        ...turn,
        decisions,
        neighbours: {
          previousTurnId: index > 0 ? order[index - 1]! : null,
          nextTurnId: index >= 0 && index < order.length - 1 ? order[index + 1]! : null,
        },
      };
    },
  });
}

/** The queue-specific display fields (risk score, assignee, status) for one finding — used by the turn-detail drawer. */
export function useQueueItem(findingId: string | undefined) {
  const source = useQueueSource();
  const nameOf = useNameResolver(source.data?.users);

  return useQuery({
    queryKey: queryKeys.queue.source,
    queryFn: loadQueueSource,
    enabled: Boolean(findingId),
    select: (data): QueueItem => {
      const finding = data.findings.find((candidate) => candidate.finding_id === findingId);
      if (!finding) throw new ApiError(404, 'Queue item not found.');
      return toQueueItem(finding, data.runs, nameOf);
    },
  });
}
