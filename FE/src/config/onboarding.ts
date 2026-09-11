import type { OnboardingStepId } from '@/types/domain';
import type { Permission } from '@/auth/roles';

interface OnboardingStepMeta {
  title: string;
  actionLabel: string;
  to: string;
  /** Hides the action for roles that cannot perform it. */
  permission: Permission;
}

/**
 * Titles and destinations for the setup checklist. The API supplies only each
 * step's state; routes belong to the frontend.
 */
export const onboardingStepMeta: Record<OnboardingStepId, OnboardingStepMeta> = {
  invite_team: {
    title: 'Invite your team',
    actionLabel: 'Manage users',
    to: '/admin/users',
    permission: 'manageUsers',
  },
  set_configuration: {
    title: 'Set audit configuration',
    actionLabel: 'Review settings',
    to: '/admin/configuration',
    permission: 'manageAudit',
  },
  work_queue: {
    title: 'Work the review queue',
    actionLabel: 'Open queue',
    to: '/queue',
    permission: 'reviewConversations',
  },
};

/** Render order, independent of what the API happens to return. */
export const onboardingOrder: OnboardingStepId[] = ['invite_team', 'set_configuration', 'work_queue'];
