import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminUsersApi } from '@/api/backend/services';
import { toBackendRole, toPlatformUser } from '@/api/backend/mappers';
import { queryKeys } from '@/api/queryKeys';
import type { PlatformUser, Role } from '@/types/domain';

function invalidateUsers(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.admin.users });
  void queryClient.invalidateQueries({ queryKey: queryKeys.admin.accessLog });
}

/** Creates the user in Cognito and sends the invitation email. */
export function useInviteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; email: string; role: Role }): Promise<PlatformUser> =>
      toPlatformUser(
        await adminUsersApi.create({
          email: input.email,
          role_code: toBackendRole(input.role),
          display_name: input.name || null,
        }),
      ),
    onSuccess: () => invalidateUsers(queryClient),
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => toPlatformUser(await adminUsersApi.deactivate(userId)),
    onSuccess: () => invalidateUsers(queryClient),
  });
}

export function useReactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => toPlatformUser(await adminUsersApi.reactivate(userId)),
    onSuccess: () => invalidateUsers(queryClient),
  });
}

export function useResendInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      await adminUsersApi.resendInvite(userId);
    },
    onSuccess: () => invalidateUsers(queryClient),
  });
}

export function useChangeUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: Role }) =>
      toPlatformUser(await adminUsersApi.setRole(userId, { role_code: toBackendRole(role) })),
    onSuccess: () => invalidateUsers(queryClient),
  });
}
