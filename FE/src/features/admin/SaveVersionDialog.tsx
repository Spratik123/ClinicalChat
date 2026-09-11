import { useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, TextField, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useSaveConfigVersion } from '@/api/mutations/auditConfig';
import { useUiStore } from '@/stores/uiStore';
import { tokens } from '@/theme/tokens';
import type { ConfigDraft } from '@/api/mutations/auditConfig';

interface SaveVersionDialogProps {
  open: boolean;
  onClose: () => void;
  draft: ConfigDraft;
  nextVersion: number;
}

/**
 * The only way a draft becomes real: a required note, same rule as every
 * other decision in this app (BRD 11). The active version is never edited in
 * place — this always creates version N+1.
 */
export function SaveVersionDialog({ open, onClose, draft, nextVersion }: SaveVersionDialogProps) {
  const [note, setNote] = useState('');
  const mutation = useSaveConfigVersion();
  const pushToast = useUiStore((state) => state.pushToast);

  const handleClose = () => {
    setNote('');
    mutation.reset();
    onClose();
  };

  const handleSave = () => {
    mutation.mutate(
      { ...draft, note: note.trim() },
      {
        onSuccess: (version) => {
          pushToast(`Saved configuration v${version.version}.`, 'success');
          handleClose();
        },
      },
    );
  };

  return (
    <Dialog open={open} onClose={mutation.isPending ? undefined : handleClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Save as v{nextVersion}
        <IconButton size="small" onClick={handleClose} disabled={mutation.isPending}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stack sx={{ gap: 2 }}>
          {mutation.isError && (
            <Alert severity="error">
              {mutation.error instanceof Error ? mutation.error.message : 'Could not save this version.'}
            </Alert>
          )}

          <Typography sx={{ fontSize: 13, color: tokens.color.inkMuted }}>
            This becomes the active configuration immediately. v{nextVersion - 1} stays in version
            history and can be restored later.
          </Typography>

          <TextField
            label="What changed, and why"
            required
            multiline
            minRows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Required — this is what version history shows for this change."
            autoFocus
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={!note.trim() || mutation.isPending}>
          {mutation.isPending ? 'Saving…' : `Save as v${nextVersion}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
