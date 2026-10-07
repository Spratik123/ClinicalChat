import { useEffect, useState } from 'react';
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
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useCreateRun } from '@/api/mutations/scheduler';
import { useAuditConfigs } from '@/api/queries/auditConfig';
import { useQueueSource } from '@/api/queries/queue';
import { useUiStore } from '@/stores/uiStore';
import { tokens } from '@/theme/tokens';

interface ScheduleRunDialogProps {
  open: boolean;
  onClose: () => void;
}

/** `datetime-local` value (local time, no zone) for a Date. */
function toLocalInput(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

/**
 * Starts an ad-hoc batch outside any schedule. With no schedule named, the
 * backend needs the audit window and the content library explicitly; the run
 * uses the chosen configuration's current version and stops at its per-run
 * cost cap. This spends Bedrock budget.
 */
export function ScheduleRunDialog({ open, onClose }: ScheduleRunDialogProps) {
  const mutation = useCreateRun();
  const configsQuery = useAuditConfigs();
  const sourceQuery = useQueueSource();
  const pushToast = useUiStore((state) => state.pushToast);

  const [configId, setConfigId] = useState('');
  const [since, setSince] = useState('');
  const [until, setUntil] = useState('');
  const [libraryId, setLibraryId] = useState('');

  // The most recent run's library is the sensible default for the next one.
  const latestLibrary = sourceQuery.data
    ? [...sourceQuery.data.runs.values()]
        .sort((a, b) => Date.parse(b.window_until) - Date.parse(a.window_until))
        .find((run) => run.library_id)?.library_id
    : undefined;

  useEffect(() => {
    if (!open) return;
    const now = new Date();
    setUntil(toLocalInput(now));
    setSince(toLocalInput(new Date(now.getTime() - 24 * 60 * 60 * 1000)));
    mutation.reset();
    // Re-seed only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!configId && configsQuery.data?.[0]) setConfigId(configsQuery.data[0].config_id);
  }, [configId, configsQuery.data]);

  useEffect(() => {
    if (!libraryId && latestLibrary) setLibraryId(latestLibrary);
  }, [libraryId, latestLibrary]);

  const windowValid = since !== '' && until !== '' && new Date(until) > new Date(since);
  const canStart = Boolean(configId && libraryId.trim() && windowValid) && !mutation.isPending;

  const handleStart = () => {
    mutation.mutate(
      {
        config_id: configId,
        library_id: libraryId.trim(),
        window_since: new Date(since).toISOString(),
        window_until: new Date(until).toISOString(),
      },
      {
        onSuccess: (run) => {
          pushToast(`Run ${run.run_id.slice(0, 8)} queued — ${run.turns_in_scope} turns in scope.`, 'success');
          onClose();
          mutation.reset();
        },
      },
    );
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
        <Stack sx={{ gap: 2, pt: 0.5 }}>
          {mutation.isError && (
            <Alert severity="error">
              {mutation.error instanceof Error ? mutation.error.message : 'Could not start the run.'}
            </Alert>
          )}

          <Typography sx={{ fontSize: 13.5, color: tokens.color.inkMuted, lineHeight: 1.6 }}>
            Audits the conversation turns in this window using the configuration&apos;s current version. It spends
            inference budget, up to that configuration&apos;s per-run cost cap.
          </Typography>

          <TextField select size="small" label="Configuration" value={configId} onChange={(event) => setConfigId(event.target.value)}>
            {configsQuery.data?.map((config) => (
              <MenuItem key={config.config_id} value={config.config_id}>
                {config.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            size="small"
            type="datetime-local"
            label="Window start"
            value={since}
            onChange={(event) => setSince(event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            size="small"
            type="datetime-local"
            label="Window end"
            value={until}
            onChange={(event) => setUntil(event.target.value)}
            error={since !== '' && until !== '' && !windowValid}
            helperText={since !== '' && until !== '' && !windowValid ? 'Must be after the start.' : undefined}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            size="small"
            label="Library ID"
            value={libraryId}
            onChange={(event) => setLibraryId(event.target.value)}
            helperText="The content library to audit against — defaults to the last run's."
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleStart} disabled={!canStart}>
          {mutation.isPending ? 'Starting…' : 'Start run'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
