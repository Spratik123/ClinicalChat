import type { Role } from '@/types/domain';

/** Display labels for the three personas in BRD section 5. */
export const roleLabels: Record<Role, string> = {
  owner_admin: 'Owner / Admin',
  content_reviewer: 'Content Reviewer',
  developer: 'Developer',
};

/**
 * Capability-based permissions. Components ask "can this user approve content?"
 * rather than "is this user an admin?", so adding a role later does not mean
 * hunting down every role comparison in the codebase.
 */
export const permissions = {
  /** Configure the audit, manage users, run the scheduler. */
  manageAudit: ['owner_admin'],
  manageUsers: ['owner_admin'],
  /** Approve a drafted answer, intent merge, or new-flow recommendation. */
  approveContentChange: ['owner_admin', 'content_reviewer'],
  /** Act on a safety-critical finding. */
  resolveSafetyFinding: ['owner_admin', 'content_reviewer'],
  /** See engineering-routed findings (genuine AI misses) and the raw trace. */
  viewEngineeringFindings: ['owner_admin', 'developer'],
  /** Read the review queue and turn detail. */
  reviewConversations: ['owner_admin', 'content_reviewer', 'developer'],
  /** Read reporting. */
  viewReports: ['owner_admin', 'content_reviewer', 'developer'],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof permissions;

export function can(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false;
  return (permissions[permission] as readonly Role[]).includes(role);
}
