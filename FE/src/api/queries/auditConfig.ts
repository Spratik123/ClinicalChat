import { useQuery } from '@tanstack/react-query';
import { auditConfigApi } from '@/api/backend/services';
import { queryKeys } from '@/api/queryKeys';

/** Every audit configuration the backend holds (names + current version number). */
export function useAuditConfigs() {
  return useQuery({
    queryKey: queryKeys.admin.config,
    queryFn: () => auditConfigApi.list(),
  });
}

/** All versions of one configuration, newest first. The highest number is the current one. */
export function useConfigVersions(configId: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.admin.configVersions, configId],
    enabled: Boolean(configId),
    queryFn: async () => {
      const versions = await auditConfigApi.versions(configId!);
      return [...versions].sort((a, b) => b.version_number - a.version_number);
    },
  });
}
