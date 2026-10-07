import { useState } from 'react';
import { Button } from '@mui/material';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { QueryBoundary } from '@/components/common/QueryBoundary';
import { useAccessLog, useUsers } from '@/api/queries/users';
import { UserTable } from './UserTable';
import { AccessLogPanel } from './AccessLogPanel';
import { InviteUserDialog } from './InviteUserDialog';

/**
 * Role-based access with mandatory MFA (BRD 11). No dedicated feature-list
 * line item — this exists because BRD 5/11 require it, not because a
 * CC-P1-xxx feature calls for it directly.
 */
export function UsersPage() {
  const usersQuery = useUsers();
  const accessLogQuery = useAccessLog();
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="Users & roles"
        description="Role-based access, granted by invitation. Every access change is logged and retained per HIPAA/SOC-2."
        actions={
          <Button size="small" variant="contained" startIcon={<PersonAddOutlinedIcon />} onClick={() => setInviteOpen(true)}>
            Invite user
          </Button>
        }
      />

      <QueryBoundary query={usersQuery}>
        {(users) => (
          <Panel title="Team" subtitle={`${users.length} user${users.length === 1 ? '' : 's'}`} flush>
            <UserTable users={users} />
          </Panel>
        )}
      </QueryBoundary>

      <QueryBoundary query={accessLogQuery}>{(entries) => <AccessLogPanel entries={entries} />}</QueryBoundary>

      <InviteUserDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </>
  );
}
