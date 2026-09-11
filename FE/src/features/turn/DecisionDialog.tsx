import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useRecordDecision } from '@/api/mutations/review';
import { useUiStore } from '@/stores/uiStore';
import { tokens } from '@/theme/tokens';
import type { DecisionKind } from '@/types/domain';

interface DecisionDialogProps {
  open: boolean;
  onClose: () => void;
  turnId: string;
  findingId: string;
  findingTitle: string;
  /** Which button opened the dialog — preselects the decision, not fixed. */
  initialDecision: DecisionKind;
}

const decisionCopy: Record<DecisionKind, { label: string; help: string }> = {
  approve: {
    label: 'Approve',
    help: 'Routes this finding to its owner for action. This platform does not write to the live intent library directly (BRD 6.4).',
  },
  request_changes: {
    label: 'Request changes',
    help: 'Sends this back for rework before it is routed anywhere.',
  },
  reject: {
    label: 'Reject',
    help: 'Marks this finding as not actionable. It stays on the turn record for audit purposes.',
  },
};

/**
 * Records a human decision on a finding.
 *
 * A comment is mandatory on every decision — it is what makes the decision
 * auditable per BRD 11, not just a UI nicety. Approving never edits the bot
 * directly; it routes the finding to whichever owner the finding type
 * specifies (safety / content / engineering).
 */
export function DecisionDialog({
  open,
  onClose,
  turnId,
  findingId,
  findingTitle,
  initialDecision,
}: DecisionDialogProps) {
  const [decision, setDecision] = useState<DecisionKind>(initialDecision);
  const [comment, setComment] = useState('');
  const mutation = useRecordDecision();
  const pushToast = useUiStore((state) => state.pushToast);

  useEffect(() => {
    if (open) {
      setDecision(initialDecision);
      setComment('');
      mutation.reset();
    }
    // Only re-seed when the dialog opens or the triggering button changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialDecision]);

  const handleSubmit = () => {
    mutation.mutate(
      { findingId, turnId, decision, comment: comment.trim() },
      {
        onSuccess: (result) => {
          pushToast(
            decision === 'approve'
              ? `Routed to ${result.routedTo}.`
              : decision === 'reject'
                ? 'Finding rejected.'
                : 'Changes requested.',
            decision === 'approve' ? 'success' : 'default',
          );
          onClose();
        },
      },
    );
  };

  return (
    <Dialog open={open} onClose={mutation.isPending ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Record decision
        <IconButton size="small" onClick={onClose} disabled={mutation.isPending}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Typography sx={{ fontSize: 13, color: tokens.color.inkMuted, mb: 2 }}>{findingTitle}</Typography>

        <Stack sx={{ gap: 2 }}>
          {mutation.isError && (
            <Alert severity="error">
              {mutation.error instanceof Error ? mutation.error.message : 'Could not record this decision.'}
            </Alert>
          )}

          <ToggleButtonGroup
            exclusive
            fullWidth
            size="small"
            value={decision}
            onChange={(_event, next: DecisionKind | null) => next && setDecision(next)}
          >
            <ToggleButton value="approve">Approve</ToggleButton>
            <ToggleButton value="request_changes">Request changes</ToggleButton>
            <ToggleButton value="reject">Reject</ToggleButton>
          </ToggleButtonGroup>

          <Typography sx={{ fontSize: 12, color: tokens.color.inkFaint }}>{decisionCopy[decision].help}</Typography>

          <TextField
            label="Comment"
            required
            multiline
            minRows={3}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Why this decision — required for the compliance log."
            autoFocus
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!comment.trim() || mutation.isPending}
          sx={
            decision === 'reject'
              ? { bgcolor: tokens.color.high, '&:hover': { bgcolor: tokens.color.highInk } }
              : undefined
          }
        >
          {mutation.isPending ? 'Recording…' : decisionCopy[decision].label}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
