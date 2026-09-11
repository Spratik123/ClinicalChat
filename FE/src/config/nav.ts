import type { Permission } from '@/auth/roles';

export interface NavItem {
  label: string;
  to: string;
  /** Route prefixes that should also light this item up (e.g. /turns under Queue). */
  matchPrefixes?: string[];
  icon: NavIcon;
  permission: Permission;
  /** Which live counter, if any, renders as a badge on this item. */
  badge?: 'queueDepth';
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export type NavIcon = 'dashboard' | 'queue' | 'recommendations' | 'reports' | 'users' | 'config' | 'scheduler';

/**
 * Rail structure from the client prototype, with a capability attached to each
 * entry so the rail renders per-role without a second source of truth.
 */
export const navGroups: NavGroup[] = [
  {
    items: [
      {
        label: 'Dashboard',
        to: '/dashboard',
        icon: 'dashboard',
        permission: 'viewReports',
      },
      {
        label: 'Review queue',
        to: '/queue',
        matchPrefixes: ['/turns'],
        icon: 'queue',
        permission: 'reviewConversations',
        badge: 'queueDepth',
      },
      {
        // BRD/code name is "Recommendations" (CC-P1-014/018/019); relabelled
        // per the client's screenshots, which show this exact feature set
        // (unanswered clusters, merge suggestions, new-flow recommendations,
        // prompt review) under "Library review".
        label: 'Library review',
        to: '/recommendations',
        icon: 'recommendations',
        permission: 'reviewConversations',
      },
      {
        label: 'Reports',
        to: '/reports',
        icon: 'reports',
        permission: 'viewReports',
      },
    ],
  },
  {
    label: 'Admin',
    items: [
      {
        label: 'Users & roles',
        to: '/admin/users',
        icon: 'users',
        permission: 'manageUsers',
      },
      {
        label: 'Audit configuration',
        to: '/admin/configuration',
        icon: 'config',
        permission: 'manageAudit',
      },
      {
        // BRD/code name is "Scheduler"; relabelled to "Audit runs" per the
        // client's screenshots (run history, next run, batch progress).
        label: 'Audit runs',
        to: '/admin/scheduler',
        icon: 'scheduler',
        permission: 'manageAudit',
      },
    ],
  },
];
