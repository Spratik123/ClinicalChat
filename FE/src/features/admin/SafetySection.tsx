import { Alert, Box, Slider, Stack, Switch, Tooltip, Typography } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Panel } from '@/components/common/Panel';
import { tokens } from '@/theme/tokens';
import type { AuditConfig } from '@/types/domain';

interface SafetySectionProps {
  value: AuditConfig['safety'];
  onChange: (next: AuditConfig['safety']) => void;
}

/**
 * Safety sensitivity (OQ-06). Two of these three controls are genuinely
 * editable; the third is deliberately locked — see the comment above it.
 */
export function SafetySection({ value, onChange }: SafetySectionProps) {
  return (
    <Panel title="Safety sensitivity">
      <Stack sx={{ gap: 2.5 }}>
        <Box>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>STOP / escalation detection</Typography>
              <Typography sx={{ fontSize: 12, color: tokens.color.inkFaint }}>
                Whether the audit flags missed opt-outs and emergency escalations at all
              </Typography>
            </Box>
            <Switch
              checked={value.stopEscalationDetection}
              onChange={(event) => onChange({ ...value, stopEscalationDetection: event.target.checked })}
            />
          </Stack>
          {!value.stopEscalationDetection && (
            <Alert severity="error" sx={{ mt: 1 }}>
              Off: missed STOP opt-outs and emergency escalations will not be flagged by this
              configuration once saved.
            </Alert>
          )}
        </Box>

        <Box>
          <Typography sx={{ fontSize: 13.5, fontWeight: 600, mb: 0.5 }}>
            Escalation false-positive tolerance
          </Typography>
          <Typography sx={{ fontSize: 12, color: tokens.color.inkFaint, mb: 1.5 }}>
            Lower = catches more borderline cases, more false alarms for reviewers (OQ-06)
          </Typography>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 2 }}>
            <Slider
              value={value.falsePositiveTolerance}
              onChange={(_event, next) => onChange({ ...value, falsePositiveTolerance: next as number })}
              min={0}
              max={1}
              step={0.05}
              disabled={!value.stopEscalationDetection}
              sx={{ flex: 1 }}
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
                minWidth: 44,
                textAlign: 'center',
              }}
            >
              {value.falsePositiveTolerance.toFixed(2)}
            </Box>
          </Stack>
        </Box>

        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>
              Always include safety findings in the queue
            </Typography>
            <Typography sx={{ fontSize: 12, color: tokens.color.inkFaint }}>
              Safety-critical findings are never sampled out — this is a hard rule, not a setting
              (BRD 4.2)
            </Typography>
          </Box>
          <Tooltip title="This cannot be turned off — safety findings are never sampled out of the queue.">
            <span>
              <Switch checked disabled />
            </span>
          </Tooltip>
        </Stack>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5, mt: -1.5 }}>
          <LockOutlinedIcon sx={{ fontSize: 13, color: tokens.color.inkFaint }} />
          <Typography sx={{ fontSize: 11.5, color: tokens.color.inkFaint }}>Locked</Typography>
        </Stack>
      </Stack>
    </Panel>
  );
}
