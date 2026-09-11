import { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { useAuth } from '@/auth/useAuth';
import { roleLabels } from '@/auth/roles';
import {
  useChangeUserRole,
  useDeactivateUser,
  useReactivateUser,
  useResendInvite,
} from '@/api/mutations/users';
import { useUiStore } from '@/stores/uiStore';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { tokens } from '@/theme/tokens';
import { formatRelative } from '@/utils/format';
import type { PlatformUser, Role, UserStatus } from '@/types/domain';

const statusMeta: Record<UserStatus, { label: string; fg: string; bg: string }> = {
  active: { label: 'Active', fg: tokens.color.success, bg: tokens.color.successTint },
  pending: { label: 'Pending', fg: tokens.color.medium, bg: tokens.color.mediumTint },
  deactivated: { label: 'Deactivated', fg: tokens.color.inkMuted, bg: tokens.color.lowTint },
};

const allRoles: Role[] = ['owner_admin', 'content_reviewer', 'developer'];

export function UserTable({ users }: { users: PlatformUser[] }) {
  const { user: currentUser } = useAuth();
  const pushToast = useUiStore((state) => state.pushToast);

  const changeRoleMutation = useChangeUserRole();
  const deactivateMutation = useDeactivateUser();
  const reactivateMutation = useReactivateUser();
  const resendMutation = useResendInvite();

  const [confirmDeactivate, setConfirmDeactivate] = useState<PlatformUser | null>(null);

  const handleReactivate = (user: PlatformUser) => {
    reactivateMutation.mutate(user.id, { onSuccess: () => pushToast(`${user.name} reactivated.`, 'success') });
  };

  const handleResend = (user: PlatformUser) => {
    resendMutation.mutate(user.id, { onSuccess: () => pushToast(`Invite resent to ${user.email}.`) });
  };

  const handleRoleChange = (user: PlatformUser, role: Role) => {
    changeRoleMutation.mutate(
      { userId: user.id, role },
      { onSuccess: () => pushToast(`${user.name}'s role changed to ${roleLabels[role]}.`) },
    );
  };

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Last login</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => {
            const isSelf = user.id === currentUser?.id;
            const status = statusMeta[user.status];

            return (
              <TableRow key={user.id}>
                <TableCell>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>{user.name}</Typography>
                  {isSelf && (
                    <Typography sx={{ fontSize: 11, color: tokens.color.inkFaint }}>You</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontSize: 13 }}>{user.email}</Typography>
                </TableCell>
                <TableCell>
                  {isSelf ? (
                    <Tooltip title="You can't change your own role">
                      <Chip size="small" label={roleLabels[user.role]} sx={{ bgcolor: tokens.color.surfaceSunk }} />
                    </Tooltip>
                  ) : (
                    <Select
                      size="small"
                      value={user.role}
                      disabled={changeRoleMutation.isPending || user.status === 'deactivated'}
                      onChange={(event) => handleRoleChange(user, event.target.value as Role)}
                      sx={{ fontSize: 13, minWidth: 150 }}
                    >
                      {allRoles.map((role) => (
                        <MenuItem key={role} value={role} sx={{ fontSize: 13 }}>
                          {roleLabels[role]}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                </TableCell>
                <TableCell>
                  <Chip size="small" label={status.label} sx={{ bgcolor: status.bg, color: status.fg }} />
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontSize: 12.5, color: tokens.color.inkMuted }}>
                    {user.lastLoginAt ? formatRelative(user.lastLoginAt) : 'Never logged in'}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  {isSelf ? (
                    <Box component="span" sx={{ fontSize: 12, color: tokens.color.inkFaint }}>
                      —
                    </Box>
                  ) : user.status === 'pending' ? (
                    <Button size="small" variant="text" onClick={() => handleResend(user)} disabled={resendMutation.isPending}>
                      Resend invite
                    </Button>
                  ) : user.status === 'deactivated' ? (
                    <Button size="small" variant="text" onClick={() => handleReactivate(user)} disabled={reactivateMutation.isPending}>
                      Reactivate
                    </Button>
                  ) : (
                    <Button size="small" variant="text" color="error" onClick={() => setConfirmDeactivate(user)}>
                      Deactivate
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <ConfirmDialog
        open={confirmDeactivate !== null}
        onClose={() => setConfirmDeactivate(null)}
        onConfirm={() => {
          if (!confirmDeactivate) return;
          deactivateMutation.mutate(confirmDeactivate.id, {
            onSuccess: () => {
              pushToast(`${confirmDeactivate.name} deactivated.`);
              setConfirmDeactivate(null);
            },
          });
        }}
        title="Deactivate this user?"
        description={
          confirmDeactivate
            ? `${confirmDeactivate.name} (${confirmDeactivate.email}) will lose access immediately. This can be undone from the same row.`
            : ''
        }
        confirmLabel="Deactivate"
        destructive
        pending={deactivateMutation.isPending}
        errorMessage={deactivateMutation.error instanceof Error ? deactivateMutation.error.message : undefined}
      />
    </>
  );
}
