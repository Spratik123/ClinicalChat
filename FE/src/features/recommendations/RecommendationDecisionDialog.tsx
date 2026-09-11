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
import { useRecordRecommendationDecision } from '@/api/mutations/recommendations';
import { useUiStore } from '@/stores/uiStore';
import { tokens } from '@/theme/tokens';
import type { DecisionKind } from '@/types/domain';

interface RecommendationDecisionDialogProps {
  open: boolean;
  onClose: () => void;
  recommendationId: string;
  recommendationTitle: string;
  /** What approving this specific kind routes to — shown as the approve help text. */
  approveHelp: string;
  initialDecision: DecisionKind;
}

const baseCopy: Record<DecisionKind, { label: string; help: string }> = {
  approve: { label: 'Approve', help: '' }, // help filled in from `approveHelp` per kind
  request_changes: {
    label: 'Request changes',
    help: 'Sends this back for rework — the drafted answer or suggestion needs revision before it can be routed.',
  },
  reject: {
    label: 'Reject',
    help: 'Marks this recommendation as not actionable. It stays on record for audit purposes.',
  },
};

/**
 * Records a human decision on a recommendation — a drafted content-gap
 * answer, an intent merge, a new-flow proposal, or a prompt-change suggestion
 * (CC-P1-006/014/015/018/019).
 *
 * Same rule as the finding decision dialog: a comment is mandatory (BRD 11),
 * and approving never edits anything live — it routes the recommendation to
 * whichever workflow the kind specifies.
 */
export function RecommendationDecisionDialog({
  open,
  onClose,
  recommendationId,
  recommendationTitle,
  approveHelp,
  initialDecision,
}: RecommendationDecisionDialogProps) {
  const [decision, setDecision] = useState<DecisionKind>(initialDecision);
  const [comment, setComment] = useState('');
  const mutation = useRecordRecommendationDecision();
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

  const help = decision === 'approve' ? approveHelp : baseCopy[decision].help;

  const handleSubmit = () => {
    mutation.mutate(
      { recommendationId, decision, comment: comment.trim() },
      {
        onSuccess: (result) => {
          pushToast(
            decision === 'approve'
              ? `Routed to ${result.routedTo}.`
              : decision === 'reject'
                ? 'Recommendation rejected.'
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
        <Typography sx={{ fontSize: 13, color: tokens.color.inkMuted, mb: 2 }}>{recommendationTitle}</Typography>

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

          <Typography sx={{ fontSize: 12, color: tokens.color.inkFaint }}>{help}</Typography>

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
          {mutation.isPending ? 'Recording…' : baseCopy[decision].label}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
