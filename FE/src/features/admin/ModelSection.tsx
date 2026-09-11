import { Box, MenuItem, Select, Stack, Typography } from '@mui/material';
import { Panel } from '@/components/common/Panel';
import { tokens } from '@/theme/tokens';
import type { AuditConfig } from '@/types/domain';

const DISABLED = '__disabled__';

/** Plausible Bedrock model identifiers for the two-stage cascade (OQ-04's "model choice"). */
const screeningModels = [
  { id: 'bedrock/anthropic.claude-haiku', label: 'Bedrock — Claude Haiku (fast, cheap)' },
  { id: 'bedrock/anthropic.claude-sonnet', label: 'Bedrock — Claude Sonnet' },
];

const diagnosisModels = [
  { id: 'bedrock/anthropic.claude-sonnet', label: 'Bedrock — Claude Sonnet (deep)' },
  { id: 'bedrock/anthropic.claude-opus', label: 'Bedrock — Claude Opus (deepest, slowest)' },
];

interface ModelSectionProps {
  value: AuditConfig['models'];
  onChange: (next: AuditConfig['models']) => void;
}

/**
 * The two-stage model cascade: a cheap screening pass over every turn, and an
 * optional deeper diagnosis pass over what screening flags. Disabling the
 * diagnosis stage is a real, one-stage-only configuration, not a placeholder
 * — some cost/volume trade-offs genuinely call for it (OQ-04).
 */
export function ModelSection({ value, onChange }: ModelSectionProps) {
  return (
    <Panel title="Model & prompt">
      <Stack sx={{ gap: 2.5 }}>
        <Box>
          <Typography sx={{ fontSize: 13.5, fontWeight: 600, mb: 0.5 }}>Phase 1 screening model</Typography>
          <Typography sx={{ fontSize: 12, color: tokens.color.inkFaint, mb: 1 }}>
            Runs over every turn — cheap and fast by design
          </Typography>
          <Select
            size="small"
            value={value.screeningModel}
            onChange={(event) => onChange({ ...value, screeningModel: event.target.value })}
            sx={{ minWidth: 320 }}
          >
            {screeningModels.map((model) => (
              <MenuItem key={model.id} value={model.id}>
                {model.label}
              </MenuItem>
            ))}
          </Select>
        </Box>

        <Box>
          <Typography sx={{ fontSize: 13.5, fontWeight: 600, mb: 0.5 }}>Phase 2 diagnosis model</Typography>
          <Typography sx={{ fontSize: 12, color: tokens.color.inkFaint, mb: 1 }}>
            Deeper pass over what screening flags — disabling it keeps the audit to one stage
          </Typography>
          <Select
            size="small"
            value={value.diagnosisModel ?? DISABLED}
            onChange={(event) =>
              onChange({ ...value, diagnosisModel: event.target.value === DISABLED ? null : event.target.value })
            }
            sx={{ minWidth: 320 }}
          >
            <MenuItem value={DISABLED} sx={{ color: tokens.color.inkFaint }}>
              Disabled
            </MenuItem>
            {diagnosisModels.map((model) => (
              <MenuItem key={model.id} value={model.id}>
                {model.label}
              </MenuItem>
            ))}
          </Select>
        </Box>
      </Stack>
    </Panel>
  );
}
