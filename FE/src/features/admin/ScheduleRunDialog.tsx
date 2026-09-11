import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useCreateRun } from '@/api/mutations/scheduler';
import { useUiStore } from '@/stores/uiStore';
import { tokens } from '@/theme/tokens';

interface ScheduleRunDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Starts an ad-hoc batch outside the nightly schedule. Deliberately no window
 * or flow-filter picker here yet — those inputs would just be decorative
 * until the batch engine actually accepts them, so this asks for confirmation
 * and nothing it can't act on. It uses the active audit configuration and its
 * cost cap, exactly like a scheduled run does.
 */
export function ScheduleRunDialog({ open, onClose }: ScheduleRunDialogProps) {
  const mutation = useCreateRun();
  const pushToast = useUiStore((state) => state.pushToast);

  const handleStart = () => {
    mutation.mutate(undefined, {
      onSuccess: (run) => {
        pushToast(`${run.id} queued.`, 'success');
        onClose();
        mutation.reset();
      },
    });
  };

  return (
    <Dialog open={open} onClose={mutation.isPending ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Start an ad-hoc audit run
        <IconButton size="small" onClick={onClose} disabled={mutation.isPending}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {mutation.isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {mutation.error instanceof Error ? mutation.error.message : 'Could not start the run.'}
          </Alert>
        )}

        <Typography sx={{ fontSize: 13.5, color: tokens.color.inkMuted, lineHeight: 1.6 }}>
          This queues a batch outside the nightly schedule, using the active audit configuration
          and its per-run cost cap — the same governance a scheduled run gets.
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleStart} disabled={mutation.isPending}>
          {mutation.isPending ? 'Starting…' : 'Start run'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
