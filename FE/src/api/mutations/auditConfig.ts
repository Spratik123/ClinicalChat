import { useMutation, useQueryClient } from '@tanstack/react-query';
import { auditConfigApi } from '@/api/backend/services';
import type { AuditConfigVersionFields, CreateAuditConfigRequest } from '@/api/backend/types';
import { queryKeys } from '@/api/queryKeys';

/**
 * Saves a new immutable version of a configuration. The active version is never
 * edited in place — this always creates version N+1.
 */
export function useSaveConfigVersion(configId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: AuditConfigVersionFields) => auditConfigApi.createVersion(configId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.config });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.configVersions });
    },
  });
}

/** Creates a configuration; the backend starts it at version 1. */
export function useCreateConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateAuditConfigRequest) => auditConfigApi.create(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.config });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.configVersions });
    },
  });
}
