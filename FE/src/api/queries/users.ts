import { useQuery } from '@tanstack/react-query';
import { adminUsersApi } from '@/api/backend/services';
import { toAccessLogEntries, toPlatformUser } from '@/api/backend/mappers';
import type { UserResponse } from '@/api/backend/types';
import { queryKeys } from '@/api/queryKeys';
import type { AccessLogEntry, PlatformUser } from '@/types/domain';

const PAGE_SIZE = 100;
/** Safety valve so a misbehaving cursor can never loop forever. */
const MAX_PAGES = 20;

/** Follows the cursor until the directory is exhausted. */
async function fetchAllUsers(): Promise<UserResponse[]> {
  const users: UserResponse[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const result = await adminUsersApi.list({ limit: PAGE_SIZE, cursor });
    users.push(...result.items);
    if (!result.has_more || !result.next_cursor) break;
    cursor = result.next_cursor;
  }

  return users;
}

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.admin.users,
    queryFn: async (): Promise<PlatformUser[]> => (await fetchAllUsers()).map(toPlatformUser),
  });
}

/**
 * The platform's identity/access audit trail (BRD 11). The backend logs user
 * ids only, so the directory is fetched alongside to show people's names.
 */
export function useAccessLog() {
  return useQuery({
    queryKey: queryKeys.admin.accessLog,
    queryFn: async (): Promise<AccessLogEntry[]> => {
      const [log, users] = await Promise.all([adminUsersApi.accessLog({ limit: 100 }), fetchAllUsers()]);
      const byId = new Map(users.map((user) => [user.user_id, toPlatformUser(user)]));
      return toAccessLogEntries(log.items, byId);
    },
  });
}
