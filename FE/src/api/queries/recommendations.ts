import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import type { Recommendation } from '@/types/domain';

interface RecommendationsResponse {
  items: Recommendation[];
  total: number;
}

/**
 * The dataset is small enough (a handful of recommendations at a time) that
 * filtering by kind happens client-side in the page rather than as server
 * query params — there's no pagination concern here the way there is for the
 * turn/finding queue.
 */
export function useRecommendations() {
  return useQuery({
    queryKey: queryKeys.recommendations.all,
    queryFn: () => api.get<RecommendationsResponse>('/recommendations'),
  });
}
