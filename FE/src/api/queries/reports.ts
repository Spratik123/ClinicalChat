import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import type { IntentConfusionTrend, ReportSummary, UnansweredTopic } from '@/types/domain';

export function useReportSummary() {
  return useQuery({
    queryKey: queryKeys.reports.summary,
    queryFn: () => api.get<ReportSummary>('/reports/summary'),
  });
}

export function useReportTrends() {
  return useQuery({
    queryKey: queryKeys.reports.trends,
    queryFn: () => api.get<IntentConfusionTrend[]>('/reports/trends'),
  });
}

export function useUnansweredTopics() {
  return useQuery({
    queryKey: queryKeys.reports.unanswered,
    queryFn: () => api.get<UnansweredTopic[]>('/reports/unanswered'),
  });
}
