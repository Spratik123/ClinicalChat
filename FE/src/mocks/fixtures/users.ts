import type { AccessLogEntry, PlatformUser, Role } from '@/types/domain';

/** Passwords are irrelevant in the mock layer — any non-empty value works. */
export const mockUsers: PlatformUser[] = [
  {
    id: 'usr_dana',
    name: 'Dana Whitfield',
    email: 'dana.whitfield@futransolutions.com',
    role: 'owner_admin',
    status: 'active',
    lastLoginAt: '2026-09-09T14:02:00Z',
  },
  {
    id: 'usr_marcus',
    name: 'Marcus Lee',
    email: 'marcus.lee@clinicchat.com',
    role: 'content_reviewer',
    status: 'active',
    lastLoginAt: '2026-09-08T16:12:00Z',
  },
  {
    id: 'usr_priya',
    name: 'Priya Nair',
    email: 'priya.nair@clinicchat.com',
    role: 'developer',
    status: 'pending',
    lastLoginAt: null,
  },
];

export const mockAccessLog: AccessLogEntry[] = [
  {
    id: 'acl_003',
    at: '2026-08-29T09:14:00Z',
    actor: 'Dana Whitfield',
    change: 'Invited priya.nair@clinicchat.com as Developer',
  },
  {
    id: 'acl_002',
    at: '2026-08-26T14:03:00Z',
    actor: 'Dana Whitfield',
    change: 'Changed marcus.lee@clinicchat.com scope: all libraries',
  },
  {
    id: 'acl_001',
    at: '2026-08-12T10:41:00Z',
    actor: 'Dana Whitfield',
    change: 'Deactivated j.torres@clinicchat.com (role change)',
  },
];

/**
 * Every admin action funnels through here — user management AND audit
 * configuration saves (BRD 11: "admin actions are logged and retained") — so
 * the Users & roles page's log reads as the platform's whole admin activity
 * trail, not just invitations.
 */
export function logAccessChange(actor: string, change: string): void {
  mockAccessLog.unshift({ id: `acl_${crypto.randomUUID()}`, at: new Date().toISOString(), actor, change });
}

export function findUser(id: string): PlatformUser | undefined {
  return mockUsers.find((user) => user.id === id);
}

let userSequence = 1;

export function inviteUser(input: { name: string; email: string; role: Role }): PlatformUser {
  const user: PlatformUser = {
    id: `usr_invited_${userSequence++}`,
    name: input.name,
    email: input.email,
    role: input.role,
    status: 'pending',
    lastLoginAt: null,
  };
  mockUsers.push(user);
  return user;
}
