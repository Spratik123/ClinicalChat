import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import type { AuditConfig, FindingType } from '@/types/domain';

export interface ConfigDraft {
  safety: AuditConfig['safety'];
  batch: AuditConfig['batch'];
  models: AuditConfig['models'];
  enabledFindingTypes: FindingType[];
}

interface SaveConfigVersionInput extends ConfigDraft {
  note: string;
}

/**
 * Saves a draft as a new config version. Never edits the active version in
 * place — matching the placeholder's own promise ("saving creates a new
 * version with a note"), and the same required-comment rule as every other
 * decision in this app.
 */
export function useSaveConfigVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SaveConfigVersionInput) => api.post<AuditConfig>('/admin/config/versions', input),

    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.config });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.configVersions });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.accessLog });
    },
  });
}
