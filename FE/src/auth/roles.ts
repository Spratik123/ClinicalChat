import type { Role } from '@/types/domain';

/** Display labels for the three personas in BRD section 5. */
export const roleLabels: Record<Role, string> = {
  owner_admin: 'Owner / Admin',
  content_reviewer: 'Content Reviewer',
  developer: 'Developer',
};

const ALL_ROLES: readonly Role[] = ['owner_admin', 'content_reviewer', 'developer'];

interface PermissionRule {
  /** Which personas this capability is meant for. */
  roles: readonly Role[];
  /**
   * Backend permission codes (from `GET /me`) the user must also hold. The
   * backend is the source of truth for what a role may do, so when it reports a
   * permission list the UI follows it rather than assuming from the role.
   */
  codes?: readonly string[];
}

/**
 * Capability-based permissions. Components ask "can this user approve content?"
 * rather than "is this user an admin?", so adding a role later does not mean
 * hunting down every role comparison in the codebase.
 */
export const permissions = {
  /** Invite and manage users and roles. */
  manageUsers: { roles: ['owner_admin'], codes: ['USER_READ'] },
  /** See audit configuration and its version history. */
  viewAuditConfig: { roles: ['owner_admin', 'developer'], codes: ['AUDIT_CONFIG_READ'] },
  /** Create configurations and save new versions. */
  updateAuditConfig: { roles: ['owner_admin', 'developer'], codes: ['AUDIT_CONFIG_UPDATE'] },
  /** See audit runs, their history and live progress. */
  viewAuditRuns: { roles: ['owner_admin', 'developer'], codes: ['AUDIT_RUN_READ'] },
  /** Start or retry a run and decide over-cap budget approvals. */
  triggerAuditRun: { roles: ['owner_admin', 'developer'], codes: ['AUDIT_RUN_TRIGGER'] },
  /** Approve a drafted answer, intent merge, or new-flow recommendation. */
  approveContentChange: { roles: ['owner_admin', 'content_reviewer'], codes: ['FINDING_REVIEW'] },
  /** Act on a safety-critical finding. */
  resolveSafetyFinding: { roles: ['owner_admin', 'content_reviewer'], codes: ['FINDING_REVIEW'] },
  /** See engineering-routed findings (genuine AI misses) and the raw trace. */
  viewEngineeringFindings: { roles: ['owner_admin', 'developer'], codes: ['AUDIT_DATA_READ'] },
  /** Hand a finding to any content reviewer, not just yourself. */
  assignReviews: { roles: ['owner_admin', 'developer'], codes: ['FINDING_REVIEW'] },
  /** Read the review queue and turn detail. */
  reviewConversations: { roles: ALL_ROLES, codes: ['FINDING_READ'] },
  /** Read reporting. */
  viewReports: { roles: ALL_ROLES, codes: ['DASHBOARD_READ'] },
} as const satisfies Record<string, PermissionRule>;

export type Permission = keyof typeof permissions;

/** The slice of the signed-in user that permission checks need. */
interface PermissionSubject {
  role: Role;
  /** Backend permission codes; absent when the backend did not report any. */
  permissions?: readonly string[];
}

export function can(user: PermissionSubject | null | undefined, permission: Permission): boolean {
  if (!user) return false;
  const rule: PermissionRule = permissions[permission];
  if (!rule.roles.includes(user.role)) return false;
  if (!rule.codes || !user.permissions) return true;
  const held = new Set(user.permissions);
  return rule.codes.every((code) => held.has(code));
}
