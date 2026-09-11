import { useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useInviteUser } from '@/api/mutations/users';
import { useUiStore } from '@/stores/uiStore';
import { roleLabels } from '@/auth/roles';
import type { Role } from '@/types/domain';

const invitableRoles: Role[] = ['owner_admin', 'content_reviewer', 'developer'];

export function InviteUserDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('content_reviewer');
  const mutation = useInviteUser();
  const pushToast = useUiStore((state) => state.pushToast);

  const reset = () => {
    setName('');
    setEmail('');
    setRole('content_reviewer');
    mutation.reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = () => {
    mutation.mutate(
      { name: name.trim(), email: email.trim(), role },
      {
        onSuccess: (user) => {
          pushToast(`Invited ${user.email}.`, 'success');
          handleClose();
        },
      },
    );
  };

  return (
    <Dialog open={open} onClose={mutation.isPending ? undefined : handleClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Invite a user
        <IconButton size="small" onClick={handleClose} disabled={mutation.isPending}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stack sx={{ gap: 2 }}>
          {mutation.isError && (
            <Alert severity="error">
              {mutation.error instanceof Error ? mutation.error.message : 'Could not send the invite.'}
            </Alert>
          )}

          <TextField
            label="Full name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            autoFocus
            fullWidth
          />
          <TextField
            label="Work email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            fullWidth
          />
          <TextField select label="Role" value={role} onChange={(event) => setRole(event.target.value as Role)} fullWidth>
            {invitableRoles.map((candidate) => (
              <MenuItem key={candidate} value={candidate}>
                {roleLabels[candidate]}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!name.trim() || !email.trim() || mutation.isPending}
        >
          {mutation.isPending ? 'Sending…' : 'Send invite'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
