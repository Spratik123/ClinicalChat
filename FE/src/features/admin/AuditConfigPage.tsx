import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { QueryBoundary } from '@/components/common/QueryBoundary';
import { useAuditConfigs, useConfigVersions } from '@/api/queries/auditConfig';
import { useSaveConfigVersion } from '@/api/mutations/auditConfig';
import { modelsInUse, toDraft, toVersionBody, validateDraft, type ConfigDraft } from '@/api/backend/configMappers';
import type { AuditConfigResponse, AuditConfigVersionResponse } from '@/api/backend/types';
import { useUiStore } from '@/stores/uiStore';
import { tokens } from '@/theme/tokens';
import { NewConfigDialog } from './NewConfigDialog';

/**
 * Versioned settings for the batch audit (CC-P1-002's operator controls).
 * Saving creates a new immutable version — the current one is never edited in
 * place, and a version that omits a setting resets it to the default, so the
 * form always submits the full set.
 */
export function AuditConfigPage() {
  const configsQuery = useAuditConfigs();
  const [configId, setConfigId] = useState<string | undefined>();
  const [newOpen, setNewOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="Audit configuration"
        description="Versioned settings for the batch audit. Saving creates a new version — configuration itself is auditable."
        actions={
          <Button size="small" variant="outlined" startIcon={<AddOutlinedIcon />} onClick={() => setNewOpen(true)}>
            New configuration
          </Button>
        }
      />

      <QueryBoundary query={configsQuery}>
        {(configs) => {
          const selected = configs.find((config) => config.config_id === configId) ?? configs[0];
          if (!selected) {
            return <Alert severity="info">No audit configuration exists yet. Create one to start auditing.</Alert>;
          }

          return (
            <>
              <ConfigPicker configs={configs} value={selected.config_id} onChange={setConfigId} />
              <ConfigEditor key={selected.config_id} config={selected} />
            </>
          );
        }}
      </QueryBoundary>

      <NewConfigDialog open={newOpen} onClose={() => setNewOpen(false)} onCreated={setConfigId} />
    </>
  );
}

function ConfigPicker({
  configs,
  value,
  onChange,
}: {
  configs: AuditConfigResponse[];
  value: string;
  onChange: (id: string) => void;
}) {
  const selected = configs.find((config) => config.config_id === value);

  return (
    <Stack direction="row" sx={{ alignItems: 'center', gap: 2, mb: '14px', flexWrap: 'wrap' }}>
      <Select size="small" value={value} onChange={(event) => onChange(event.target.value)} sx={{ minWidth: 300 }}>
        {configs.map((config) => (
          <MenuItem key={config.config_id} value={config.config_id}>
            {config.name}
          </MenuItem>
        ))}
      </Select>
      <Typography sx={{ fontSize: 12.5, color: tokens.color.inkMuted }}>
        {selected?.description ?? 'No description'}
      </Typography>
    </Stack>
  );
}

function ConfigEditor({ config }: { config: AuditConfigResponse }) {
  const versionsQuery = useConfigVersions(config.config_id);

  return (
    <QueryBoundary query={versionsQuery}>
      {(versions) =>
        versions.length === 0 ? (
          <Alert severity="info">This configuration has no versions yet.</Alert>
        ) : (
          <ConfigForm configId={config.config_id} versions={versions} />
        )
      }
    </QueryBoundary>
  );
}

function ConfigForm({ configId, versions }: { configId: string; versions: AuditConfigVersionResponse[] }) {
  const current = versions[0]!;
  const baseline = useMemo(() => toDraft(current), [current]);
  const [draft, setDraft] = useState<ConfigDraft>(baseline);
  const mutation = useSaveConfigVersion(configId);
  const pushToast = useUiStore((state) => state.pushToast);

  // A freshly saved version becomes the new baseline.
  useEffect(() => {
    setDraft(baseline);
  }, [baseline]);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(baseline);
  const problem = validateDraft(draft);
  const set = <K extends keyof ConfigDraft>(key: K, value: ConfigDraft[K]) =>
    setDraft((previous) => ({ ...previous, [key]: value }));

  const handleSave = () => {
    mutation.mutate(toVersionBody(draft, current), {
      onSuccess: (version) => pushToast(`Saved configuration v${version.version_number}.`, 'success'),
    });
  };

  return (
    <>
      <Stack
        direction="row"
        sx={{ alignItems: 'center', justifyContent: 'space-between', mb: '14px', gap: 2, flexWrap: 'wrap' }}
      >
        {mutation.isError ? (
          <Alert severity="error" sx={{ flex: 1, minWidth: 240 }}>
            {mutation.error instanceof Error ? mutation.error.message : 'Could not save this version.'}
          </Alert>
        ) : isDirty ? (
          <Alert severity={problem ? 'warning' : 'info'} sx={{ flex: 1, minWidth: 240 }}>
            {problem ?? `Unsaved changes — nothing takes effect until you save as v${current.version_number + 1}.`}
          </Alert>
        ) : (
          <span />
        )}
        <Stack direction="row" sx={{ gap: 1, flex: '0 0 auto' }}>
          {isDirty && (
            <Button size="small" variant="outlined" onClick={() => setDraft(baseline)}>
              Discard changes
            </Button>
          )}
          <Button
            size="small"
            variant="contained"
            startIcon={<SaveOutlinedIcon />}
            disabled={!isDirty || Boolean(problem) || mutation.isPending}
            onClick={handleSave}
          >
            {mutation.isPending ? 'Saving…' : `Save as v${current.version_number + 1}`}
          </Button>
        </Stack>
      </Stack>

      <Panel title="Models">
        <Stack sx={{ gap: 2 }}>
          <Field
            label="Phase 1 screening model"
            help="Runs over every turn — cheap and fast by design. A Bedrock model or inference-profile ARN."
            value={draft.modelPhase1}
            onChange={(value) => set('modelPhase1', value)}
            fullWidth
          />
          <Field
            label="Phase 2 diagnosis model"
            help="Deeper pass over what screening flags."
            value={draft.modelPhase2}
            onChange={(value) => set('modelPhase2', value)}
            fullWidth
          />
          <Field
            label="Prompt version"
            value={draft.promptVersion}
            onChange={(value) => set('promptVersion', value)}
          />
        </Stack>
      </Panel>

      <Panel title="Pricing" subtitle="USD per 1,000 tokens — required for every model in use">
        <Stack sx={{ gap: 2 }}>
          {modelsInUse(draft).map((model) => {
            const price = draft.prices[model] ?? { input: '', output: '' };
            const update = (field: 'input' | 'output', value: string) =>
              setDraft((previous) => ({
                ...previous,
                prices: { ...previous.prices, [model]: { ...price, [field]: value } },
              }));

            return (
              <Box key={model}>
                <Typography sx={{ fontSize: 12, fontFamily: tokens.font.mono, color: tokens.color.inkMuted, mb: 1, wordBreak: 'break-all' }}>
                  {model}
                </Typography>
                <Stack direction="row" sx={{ gap: 2 }}>
                  <Field label="Input" value={price.input} onChange={(value) => update('input', value)} />
                  <Field label="Output" value={price.output} onChange={(value) => update('output', value)} />
                </Stack>
              </Box>
            );
          })}
        </Stack>
      </Panel>

      <Panel title="Batch & generation">
        <Stack direction="row" sx={{ gap: 2, flexWrap: 'wrap' }}>
          <Field label="Batch size" value={draft.batchSize} onChange={(value) => set('batchSize', value)} />
          <Field label="Max tokens" value={draft.maxTokens} onChange={(value) => set('maxTokens', value)} />
          <Field label="Temperature (0–1)" value={draft.temperature} onChange={(value) => set('temperature', value)} />
          <Field
            label="Max tool iterations"
            value={draft.maxToolIterations}
            onChange={(value) => set('maxToolIterations', value)}
          />
        </Stack>

        <Typography sx={{ fontSize: 13.5, fontWeight: 600, mt: 2.5, mb: 1 }}>Phase 2 dispatch</Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={draft.dispatchMode}
          onChange={(_event, next: ConfigDraft['dispatchMode'] | null) => next && set('dispatchMode', next)}
        >
          <ToggleButton value="inline">Inline</ToggleButton>
          <ToggleButton value="distributed">Distributed</ToggleButton>
        </ToggleButtonGroup>
      </Panel>

      <Panel title="Cost caps & thresholds" subtitle="Leave blank to use the built-in default">
        <Stack direction="row" sx={{ gap: 2, flexWrap: 'wrap' }}>
          <Field
            label="Max USD per run"
            value={draft.maxUsdPerRun}
            onChange={(value) => set('maxUsdPerRun', value)}
          />
          <Field
            label="USD per message"
            value={draft.perMessageUsd}
            onChange={(value) => set('perMessageUsd', value)}
          />
          <Field
            label="Low-confidence threshold"
            value={draft.lowConfidenceThreshold}
            onChange={(value) => set('lowConfidenceThreshold', value)}
          />
        </Stack>
      </Panel>

      <VersionHistory versions={versions} onRestore={(version) => setDraft(toDraft(version))} />
    </>
  );
}

function Field({
  label,
  help,
  value,
  onChange,
  fullWidth,
}: {
  label: string;
  help?: string;
  value: string;
  onChange: (value: string) => void;
  fullWidth?: boolean;
}) {
  return (
    <TextField
      size="small"
      label={label}
      helperText={help}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      fullWidth={fullWidth}
      sx={fullWidth ? undefined : { width: 190 }}
    />
  );
}

/**
 * Every past version, newest first. "Restore" loads a past version's settings
 * into the form for review — it does not reactivate it; saving still creates a
 * new version.
 */
function VersionHistory({
  versions,
  onRestore,
}: {
  versions: AuditConfigVersionResponse[];
  onRestore: (version: AuditConfigVersionResponse) => void;
}) {
  const currentNumber = versions[0]?.version_number;

  return (
    <Panel title="Version history" flush>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 110 }}>Version</TableCell>
            <TableCell>Models</TableCell>
            <TableCell sx={{ width: 120 }}>Prompt</TableCell>
            <TableCell sx={{ width: 100 }}>Dispatch</TableCell>
            <TableCell sx={{ width: 100 }} />
          </TableRow>
        </TableHead>
        <TableBody>
          {versions.map((version) => (
            <TableRow key={version.config_version_id}>
              <TableCell>
                <Typography component="span" sx={{ fontFamily: tokens.font.mono, fontSize: 13 }}>
                  v{version.version_number}
                </Typography>
                {version.version_number === currentNumber && (
                  <Chip size="small" label="Current" sx={{ ml: 1, bgcolor: tokens.color.successTint, color: tokens.color.success }} />
                )}
              </TableCell>
              <TableCell>
                <Typography sx={{ fontSize: 12, fontFamily: tokens.font.mono, wordBreak: 'break-all' }}>
                  {version.model_id_phase1.split('/').pop()}
                  {version.model_id_phase2 !== version.model_id_phase1 && ` → ${version.model_id_phase2.split('/').pop()}`}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography sx={{ fontSize: 13 }}>{version.prompt_version}</Typography>
              </TableCell>
              <TableCell>
                <Typography sx={{ fontSize: 13 }}>{version.stage2_dispatch_mode}</Typography>
              </TableCell>
              <TableCell>
                {version.version_number !== currentNumber && (
                  <Button size="small" variant="text" onClick={() => onRestore(version)}>
                    Restore
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Panel>
  );
}
