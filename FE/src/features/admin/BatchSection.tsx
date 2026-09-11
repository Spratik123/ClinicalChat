import { Box, MenuItem, Select, Slider, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { Panel } from '@/components/common/Panel';
import { tokens } from '@/theme/tokens';
import { formatUsd } from '@/utils/format';
import type { AuditConfig, PopulationMode, RunCadence } from '@/types/domain';

const cadenceLabels: Record<RunCadence, string> = {
  nightly: 'Nightly',
  twelve_hourly: 'Every 12 hours',
  manual: 'Manual only',
};

interface BatchSectionProps {
  value: AuditConfig['batch'];
  onChange: (next: AuditConfig['batch']) => void;
}

/** Batch cadence and volume (OQ-04: approach, model choice, run frequency, and volume). */
export function BatchSection({ value, onChange }: BatchSectionProps) {
  return (
    <Panel title="Batch & volume">
      <Stack sx={{ gap: 2.5 }}>
        <Box>
          <Typography sx={{ fontSize: 13.5, fontWeight: 600, mb: 1 }}>Run cadence</Typography>
          <Select
            size="small"
            value={value.cadence}
            onChange={(event) => onChange({ ...value, cadence: event.target.value as RunCadence })}
            sx={{ minWidth: 200 }}
          >
            {(Object.keys(cadenceLabels) as RunCadence[]).map((cadence) => (
              <MenuItem key={cadence} value={cadence}>
                {cadenceLabels[cadence]}
              </MenuItem>
            ))}
          </Select>
        </Box>

        <Box>
          <Typography sx={{ fontSize: 13.5, fontWeight: 600, mb: 1 }}>Population mode</Typography>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={value.populationMode}
            onChange={(_event, next: PopulationMode | null) => {
              if (!next) return;
              // `samplePct` persists across mode switches (it's meaningless
              // while `full`), so a fresh switch to `sampled` can otherwise
              // silently inherit a stale 100% — start it somewhere the
              // operator will actually notice needs adjusting.
              const samplePct = next === 'sampled' && value.samplePct >= 100 ? 50 : value.samplePct;
              onChange({ ...value, populationMode: next, samplePct });
            }}
          >
            <ToggleButton value="full">Full population</ToggleButton>
            <ToggleButton value="sampled">Sampled</ToggleButton>
          </ToggleButtonGroup>

          {value.populationMode === 'sampled' && (
            <Stack direction="row" sx={{ alignItems: 'center', gap: 2, mt: 1.5 }}>
              <Slider
                value={value.samplePct}
                onChange={(_event, next) => onChange({ ...value, samplePct: next as number })}
                min={5}
                max={95}
                step={5}
                sx={{ flex: 1, maxWidth: 320 }}
              />
              <Box
                sx={{
                  fontFamily: tokens.font.mono,
                  fontSize: 12.5,
                  bgcolor: tokens.color.surfaceSunk,
                  border: `1px solid ${tokens.color.border}`,
                  borderRadius: '4px',
                  px: 1,
                  py: 0.5,
                  minWidth: 48,
                  textAlign: 'center',
                }}
              >
                {value.samplePct}%
              </Box>
            </Stack>
          )}
        </Box>

        <Box>
          <Typography sx={{ fontSize: 13.5, fontWeight: 600, mb: 1 }}>Max cost per run</Typography>
          <TextField
            size="small"
            type="number"
            value={value.maxCostPerRunUsd}
            onChange={(event) => onChange({ ...value, maxCostPerRunUsd: Math.max(0, Number(event.target.value)) })}
            slotProps={{ input: { startAdornment: '$', inputProps: { min: 0, step: 0.5 } } }}
            sx={{ width: 140 }}
          />
          <Typography sx={{ fontSize: 11.5, color: tokens.color.inkFaint, mt: 0.5 }}>
            A run stops early and reports {formatUsd(value.maxCostPerRunUsd)} spent if it hits this cap
            (surfaces as a `partial` run).
          </Typography>
        </Box>
      </Stack>
    </Panel>
  );
}
