import { Box, Stack, Typography } from '@mui/material';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import { tokens } from '@/theme/tokens';
import { formatCount, formatDayTime } from '@/utils/format';
import type { AuditRun } from '@/types/domain';

/**
 * The current in-progress batch, shown only while one exists (`running` or
 * `paused`). A batch counts as "in progress" until its findings are triaged,
 * not just until the audit pass finishes — matching the human-in-the-loop
 * rule that a run isn't really done until people have acted on it.
 *
 * `criticalOpen` is one of the few legitimate uses of safety/"Critical" red
 * outside `<SeverityBadge>`: it's a literal count of this batch's unresolved
 * STOP/escalation-miss findings, not a generic urgency indicator.
 */
export function RunInProgressCard({ run }: { run: AuditRun }) {
  if (!run.progress) return null;
  const { cleared, criticalOpen, pending, total } = run.progress;
  const percent = total > 0 ? Math.round((cleared / total) * 100) : 0;
  const isPaused = run.status === 'paused';

  return (
    <Box
      sx={{
        p: '18px 20px',
        mb: '18px',
        borderRadius: `${tokens.radius}px`,
        bgcolor: tokens.color.accentTint,
        border: `1px solid ${tokens.color.accentTintBorder}`,
      }}
    >
      <Stack direction={{ xs: 'column', md: 'row' }} sx={{ gap: '18px', alignItems: { md: 'center' } }}>
        <Stack direction="row" sx={{ gap: '14px', alignItems: 'center', flex: '1 1 auto', minWidth: 0 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              flex: '0 0 40px',
              borderRadius: '9px',
              display: 'grid',
              placeItems: 'center',
              bgcolor: tokens.color.surface,
              color: tokens.color.accent,
            }}
          >
            <MonitorHeartOutlinedIcon sx={{ fontSize: 21 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', color: tokens.color.accent }}>
              {isPaused ? 'PAUSED' : 'RUN IN PROGRESS'}
            </Typography>
            <Typography sx={{ fontFamily: tokens.font.serif, fontWeight: 700, fontSize: 17 }}>
              <Box component="span" sx={{ fontFamily: tokens.font.mono, fontWeight: 400, fontSize: 14, mr: 1 }}>
                {run.id}
              </Box>
              {run.label ?? 'Audit batch'}
            </Typography>
            <Typography sx={{ fontSize: 12, color: tokens.color.inkMuted }}>
              Audit window from {formatDayTime(run.startedAt)}
              {run.trigger === 'manual' ? ' · manual run' : ' · scheduled run'}
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ flex: '1 1 320px', minWidth: 240 }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', mb: '6px' }}>
            <Typography sx={{ fontSize: 12.5, color: tokens.color.inkMuted }}>
              {formatCount(cleared)} of {formatCount(total)} conversations cleared
            </Typography>
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: tokens.color.accent }}>{percent}%</Typography>
          </Stack>
          <Box sx={{ height: 8, borderRadius: '4px', bgcolor: 'rgba(13,148,136,0.15)', overflow: 'hidden', mb: '8px' }}>
            <Box sx={{ width: `${percent}%`, height: '100%', bgcolor: tokens.color.accent }} />
          </Box>
          <Stack direction="row" sx={{ gap: '14px', flexWrap: 'wrap' }}>
            <Legend color={tokens.color.success} label={`${formatCount(cleared)} audited`} />
            <Legend color={tokens.color.safety} label={`${formatCount(criticalOpen)} critical`} />
            <Legend color={tokens.color.inkFaint} label={`${formatCount(pending)} pending`} />
          </Stack>
        </Box>

      </Stack>
    </Box>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <Stack direction="row" sx={{ alignItems: 'center', gap: '6px' }}>
      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: color }} />
      <Typography sx={{ fontSize: 12, color: tokens.color.inkMuted }}>{label}</Typography>
    </Stack>
  );
}
