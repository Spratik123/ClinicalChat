import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Divider,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { auditConfigApi } from '@/api/backend/services';
import { modelsInUse, toDraft, toVersionBody, validateDraft, type ConfigDraft } from '@/api/backend/configMappers';
import type { AuditConfigVersionResponse } from '@/api/backend/types';
import { useAuditConfigs } from '@/api/queries/auditConfig';
import { useCreateConfig } from '@/api/mutations/auditConfig';
import { useUiStore } from '@/stores/uiStore';
import { tokens } from '@/theme/tokens';

interface NewConfigDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (configId: string) => void;
}

const BLANK: ConfigDraft = {
  modelPhase1: '',
  modelPhase2: '',
  promptVersion: '',
  temperature: '',
  maxTokens: '',
  batchSize: '20',
  maxToolIterations: '',
  dispatchMode: 'inline',
  maxUsdPerRun: '25',
  perMessageUsd: '0.01',
  stage1Share: '0.4',
  lowConfidenceThreshold: '',
  prices: {},
};

const NONE = '';

/**
 * Creates a configuration at version 1. Most settings are best copied from an
 * existing configuration, so choosing a source pre-fills the form; the models
 * and their prices can then be adjusted before creating.
 */
export function NewConfigDialog({ open, onClose, onCreated }: NewConfigDialogProps) {
  const configsQuery = useAuditConfigs();
  const mutation = useCreateConfig();
  const pushToast = useUiStore((state) => state.pushToast);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sourceId, setSourceId] = useState(NONE);
  const [base, setBase] = useState<AuditConfigVersionResponse | null>(null);
  const [draft, setDraft] = useState<ConfigDraft>(BLANK);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName('');
    setDescription('');
    setSourceId(NONE);
    setBase(null);
    setDraft(BLANK);
    setLoadError(null);
    mutation.reset();
    // Reset only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const chooseSource = (configId: string) => {
    setSourceId(configId);
    setLoadError(null);
    if (configId === NONE) {
      setBase(null);
      setDraft(BLANK);
      return;
    }
    auditConfigApi
      .current(configId)
      .then((version) => {
        setBase(version);
        setDraft(toDraft(version));
      })
      .catch((error: unknown) => setLoadError(error instanceof Error ? error.message : 'Could not load that configuration.'));
  };

  const problem = !name.trim() ? 'Give the configuration a name.' : validateDraft(draft, { requirePrices: false });

  const handleCreate = () => {
    // With no source there is no base version, so start from an empty one.
    const body = toVersionBody(draft, base ?? emptyBase(draft));
    mutation.mutate(
      { ...body, name: name.trim(), description: description.trim() || null },
      {
        onSuccess: (created) => {
          pushToast(`Created ${created.name}.`, 'success');
          onCreated(created.config_id);
          onClose();
        },
      },
    );
  };

  const set = <K extends keyof ConfigDraft>(key: K, value: ConfigDraft[K]) =>
    setDraft((previous) => ({ ...previous, [key]: value }));

  return (
    <Dialog open={open} onClose={mutation.isPending ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        New configuration
        <IconButton size="small" onClick={onClose} disabled={mutation.isPending}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stack sx={{ gap: 2, pt: 1 }}>
          {(mutation.isError || loadError) && (
            <Alert severity="error">
              {loadError ?? (mutation.error instanceof Error ? mutation.error.message : 'Could not create this configuration.')}
            </Alert>
          )}

          <TextField label="Name" size="small" value={name} onChange={(event) => setName(event.target.value)} required />
          <TextField
            label="Description"
            size="small"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />

          <TextField
            select
            size="small"
            label="Copy settings from"
            value={sourceId}
            onChange={(event) => chooseSource(event.target.value)}
          >
            <MenuItem value={NONE}>Start blank</MenuItem>
            {configsQuery.data?.map((config) => (
              <MenuItem key={config.config_id} value={config.config_id}>
                {config.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Phase 1 screening model"
            size="small"
            value={draft.modelPhase1}
            onChange={(event) => set('modelPhase1', event.target.value)}
            required
          />
          <TextField
            label="Phase 2 diagnosis model"
            size="small"
            value={draft.modelPhase2}
            onChange={(event) => set('modelPhase2', event.target.value)}
            required
          />

          <TextField
            label="Prompt version"
            size="small"
            value={draft.promptVersion}
            onChange={(event) => set('promptVersion', event.target.value)}
          />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <TextField
              fullWidth
              label="Temperature"
              size="small"
              type="number"
              value={draft.temperature}
              onChange={(event) => set('temperature', event.target.value)}
              slotProps={{ htmlInput: { min: 0, max: 1, step: 0.1 } }}
            />
            <TextField
              fullWidth
              label="Batch size"
              size="small"
              type="number"
              value={draft.batchSize}
              onChange={(event) => set('batchSize', event.target.value)}
              slotProps={{ htmlInput: { min: 1 } }}
            />
          </Box>

          <Divider />

          <Stack sx={{ gap: 0.75 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: tokens.color.inkMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>Phase 2 dispatch</Typography>
            <ToggleButtonGroup
              exclusive
              fullWidth
              size="small"
              value={draft.dispatchMode}
              onChange={(_, value: ConfigDraft['dispatchMode'] | null) => value && set('dispatchMode', value)}
            >
              <ToggleButton value="inline">Inline</ToggleButton>
              <ToggleButton value="distributed">Distributed</ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          <Stack sx={{ gap: 1 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: tokens.color.inkMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>Cost caps (USD)</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5 }}>
              <TextField
                fullWidth
                label="Max per run"
                size="small"
                type="number"
                value={draft.maxUsdPerRun}
                onChange={(event) => set('maxUsdPerRun', event.target.value)}
                slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
              />
              <TextField
                fullWidth
                label="Per message"
                size="small"
                type="number"
                value={draft.perMessageUsd}
                onChange={(event) => set('perMessageUsd', event.target.value)}
                slotProps={{ htmlInput: { min: 0, step: 0.001 } }}
              />
              <TextField
                fullWidth
                label="Stage 1 share"
                size="small"
                type="number"
                value={draft.stage1Share}
                onChange={(event) => set('stage1Share', event.target.value)}
                slotProps={{ htmlInput: { min: 0, max: 1, step: 0.05 } }}
              />
            </Box>
          </Stack>

          {modelsInUse(draft).map((model) => {
            const price = draft.prices[model] ?? { input: '', output: '' };
            const update = (field: 'input' | 'output', value: string) =>
              setDraft((previous) => ({
                ...previous,
                prices: { ...previous.prices, [model]: { ...price, [field]: value } },
              }));

            return (
              <Stack key={model} sx={{ gap: 1 }}>
                <Typography sx={{ fontSize: 11.5, fontFamily: tokens.font.mono, color: tokens.color.inkMuted, wordBreak: 'break-all' }}>
                  Price per 1k tokens · {model}
                </Typography>
                <Stack direction="row" sx={{ gap: 1.5 }}>
                  <TextField label="Input" size="small" value={price.input} onChange={(event) => update('input', event.target.value)} />
                  <TextField label="Output" size="small" value={price.output} onChange={(event) => update('output', event.target.value)} />
                </Stack>
              </Stack>
            );
          })}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleCreate} disabled={Boolean(problem) || mutation.isPending}>
          {mutation.isPending ? 'Creating…' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** A version-shaped shell so `toVersionBody` has something to merge the form into. */
function emptyBase(draft: ConfigDraft): AuditConfigVersionResponse {
  return {
    config_version_id: '',
    config_id: '',
    version_number: 0,
    model_id_phase1: draft.modelPhase1,
    model_id_phase2: draft.modelPhase2,
    prompt_version: '',
    temperature: 0,
    max_tokens: 0,
    batch_size: 0,
    max_tool_iterations: 0,
    stage2_dispatch_mode: draft.dispatchMode,
    thresholds: {},
    cost_caps: {},
    price_table: {},
  };
}
