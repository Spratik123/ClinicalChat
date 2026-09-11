import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import type { QueueItem, QueueResponse, TurnDetail } from '@/types/domain';
import type { QueueFilterState } from '@/features/queue/queueParams';
import { toSearchParams } from '@/features/queue/queueParams';

export function useQueue(filters: QueueFilterState) {
  const search = toSearchParams(filters).toString();

  return useQuery({
    queryKey: queryKeys.queue.list(filters as unknown as Record<string, unknown>),
    queryFn: () => api.get<QueueResponse>(`/queue${search ? `?${search}` : ''}`),
  });
}

export function useTurn(turnId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.turns.detail(turnId ?? ''),
    queryFn: () => api.get<TurnDetail>(`/turns/${turnId}`),
    enabled: Boolean(turnId),
  });
}

/** The queue-specific display fields (risk score, assignee, status) for one finding — used by the turn-detail drawer. */
export function useQueueItem(findingId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.queue.item(findingId ?? ''),
    queryFn: () => api.get<QueueItem>(`/queue/${findingId}`),
    enabled: Boolean(findingId),
  });
}
