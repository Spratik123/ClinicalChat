import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import type { AuditConfig } from '@/types/domain';

export function useActiveAuditConfig() {
  return useQuery({
    queryKey: queryKeys.admin.config,
    queryFn: () => api.get<AuditConfig>('/admin/config'),
  });
}

export function useConfigVersions() {
  return useQuery({
    queryKey: queryKeys.admin.configVersions,
    queryFn: () => api.get<AuditConfig[]>('/admin/config/versions'),
  });
}
