import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import type { PlatformUser, Role } from '@/types/domain';

function invalidateUsers(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.admin.users });
  void queryClient.invalidateQueries({ queryKey: queryKeys.admin.accessLog });
}

export function useInviteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; email: string; role: Role }) =>
      api.post<PlatformUser>('/admin/users', input),
    onSuccess: () => invalidateUsers(queryClient),
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.post<PlatformUser>(`/admin/users/${userId}/deactivate`),
    onSuccess: () => invalidateUsers(queryClient),
  });
}

export function useReactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.post<PlatformUser>(`/admin/users/${userId}/reactivate`),
    onSuccess: () => invalidateUsers(queryClient),
  });
}

export function useResendInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.post<void>(`/admin/users/${userId}/resend-invite`),
    onSuccess: () => invalidateUsers(queryClient),
  });
}

export function useChangeUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Role }) =>
      api.patch<PlatformUser>(`/admin/users/${userId}/role`, { role }),
    onSuccess: () => invalidateUsers(queryClient),
  });
}
