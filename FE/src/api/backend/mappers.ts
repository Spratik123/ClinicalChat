import type { AccessLogEntry, AuthUser, PlatformUser, Role, UserStatus } from '@/types/domain';
import type {
  AccessLogEntryResponse,
  BackendRoleCode,
  BackendUserStatus,
  CurrentUserResponse,
  UserResponse,
} from './types';

/**
 * Bridges backend wire shapes to the UI's domain model. Keeping this in one
 * file means a backend rename touches here, not every screen.
 */

const roleFromBackend: Record<BackendRoleCode, Role> = {
  ADMIN: 'owner_admin',
  CONTENT_REVIEWER: 'content_reviewer',
  DEVELOPER: 'developer',
};

const roleToBackend: Record<Role, BackendRoleCode> = {
  owner_admin: 'ADMIN',
  content_reviewer: 'CONTENT_REVIEWER',
  developer: 'DEVELOPER',
};

export function toBackendRole(role: Role): BackendRoleCode {
  return roleToBackend[role];
}

/** Picks the user's UI role. Backend users can hold several; the most privileged wins. */
export function toRole(roles: readonly string[] | undefined): Role {
  const codes = new Set((roles ?? []).map((code) => code.toUpperCase()));
  if (codes.has('ADMIN')) return roleFromBackend.ADMIN;
  if (codes.has('DEVELOPER')) return roleFromBackend.DEVELOPER;
  if (codes.has('CONTENT_REVIEWER')) return roleFromBackend.CONTENT_REVIEWER;
  // No recognised role: least-privileged persona rather than an unguarded one.
  return roleFromBackend.CONTENT_REVIEWER;
}

const statusFromBackend: Record<BackendUserStatus, UserStatus> = {
  invited: 'pending',
  active: 'active',
  suspended: 'deactivated',
  inactive: 'deactivated',
};

function displayName(user: UserResponse): string {
  return user.display_name?.trim() || user.email?.split('@')[0] || user.username || `User ${user.user_id}`;
}

export function toAuthUser(user: CurrentUserResponse): AuthUser {
  return {
    id: String(user.user_id),
    name: displayName(user),
    email: user.email ?? user.username ?? '',
    role: toRole(user.roles),
  };
}

export function toPlatformUser(user: UserResponse): PlatformUser {
  return {
    id: String(user.user_id),
    name: displayName(user),
    email: user.email ?? user.username ?? '',
    role: toRole(user.roles),
    status: statusFromBackend[user.status] ?? 'deactivated',
    lastLoginAt: user.last_login_at ?? null,
  };
}

const roleDisplay: Record<string, string> = {
  ADMIN: 'Owner / Admin',
  CONTENT_REVIEWER: 'Content Reviewer',
  DEVELOPER: 'Developer',
};

/**
 * The backend access log carries user ids only, so names are resolved from the
 * user directory. An id missing from it (e.g. beyond the first page) falls back
 * to a readable placeholder rather than hiding the event.
 */
export function toAccessLogEntries(
  entries: AccessLogEntryResponse[],
  usersById: ReadonlyMap<number, PlatformUser>,
): AccessLogEntry[] {
  const nameOf = (id: number | null | undefined) =>
    id == null ? 'System' : (usersById.get(id)?.name ?? `User #${id}`);

  return entries.map((entry, index) => {
    const subject = nameOf(entry.subject_user_id);
    const role = entry.role_code ? (roleDisplay[entry.role_code] ?? entry.role_code) : null;

    const change = (() => {
      switch (entry.event_type) {
        case 'USER_CREATED':
          return `Invited ${subject}`;
        case 'USER_DEACTIVATED':
          return `Deactivated ${subject}`;
        case 'ROLE_GRANTED':
          return `Granted ${subject} the ${role ?? 'a'} role`;
        case 'ROLE_REVOKED':
          return `Revoked ${role ?? 'a'} role from ${subject}`;
        default:
          return `${entry.event_type} · ${subject}`;
      }
    })();

    return {
      id: `${entry.event_type}-${entry.subject_user_id}-${entry.occurred_at ?? index}-${index}`,
      at: entry.occurred_at ?? '',
      actor: nameOf(entry.actor_user_id),
      change,
    };
  });
}
