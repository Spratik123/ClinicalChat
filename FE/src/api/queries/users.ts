import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import type { AccessLogEntry, PlatformUser } from '@/types/domain';

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.admin.users,
    queryFn: () => api.get<PlatformUser[]>('/admin/users'),
  });
}

/**
 * The platform's whole admin activity trail — user invites/deactivations
 * AND audit configuration saves land here (BRD 11), not just user
 * management, so this reads as one audit log rather than a partial one.
 */
export function useAccessLog() {
  return useQuery({
    queryKey: queryKeys.admin.accessLog,
    queryFn: () => api.get<AccessLogEntry[]>('/admin/access-log'),
  });
}
