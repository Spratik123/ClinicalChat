import { Box, Stack, Switch, Tooltip, Typography } from '@mui/material';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { Link as RouterLink } from 'react-router';
import { useToggleSchedulerJob } from '@/api/mutations/scheduler';
import { usePermission } from '@/auth/useAuth';
import { tokens } from '@/theme/tokens';
import { formatDayTime, formatDurationMinutes } from '@/utils/format';
import type { AuditRun, ScheduledJob } from '@/types/domain';
import { computeAverageDuration } from './runStats';

const cadenceLabels: Record<ScheduledJob['cadence'], string> = {
  nightly: 'Nightly',
  twelve_hourly: 'Every 12 hours',
  manual: 'Manual only',
};

export function SchedulerStatCards({ job, runs }: { job: ScheduledJob; runs: AuditRun[] }) {
  const canManage = usePermission('manageAudit');
  const toggleMutation = useToggleSchedulerJob();
  const { avgMinutes, deltaMinutes } = computeAverageDuration(runs);

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: '14px', mb: '18px' }}>
      {/* Next scheduled run */}
      <Box sx={{ p: '16px 18px', border: `1px solid ${tokens.color.border}`, borderRadius: `${tokens.radius}px`, bgcolor: tokens.color.surface }}>
        <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Stack direction="row" sx={{ gap: '12px' }}>
            <EventOutlinedIcon sx={{ fontSize: 20, color: tokens.color.accent, mt: '2px' }} />
            <Box>
              <Typography sx={{ fontSize: 11.5, color: tokens.color.inkFaint, mb: '2px' }}>
                {job.active ? 'Next scheduled run' : 'Scheduling paused'}
              </Typography>
              {job.active && job.nextRunAt ? (
                <>
                  <Typography sx={{ fontFamily: tokens.font.mono, fontSize: 17, fontWeight: 600 }}>
                    {formatDayTime(job.nextRunAt)}
                  </Typography>
                  <Typography sx={{ fontSize: 11.5, color: tokens.color.inkFaint, mt: '2px' }}>
                    {cadenceLabels[job.cadence]} · {job.timezone}
                  </Typography>
                </>
              ) : (
                <Typography sx={{ fontSize: 13, color: tokens.color.inkMuted, mt: '4px' }}>
                  No run will start until this job is turned back on.
                </Typography>
              )}
            </Box>
          </Stack>

          <Stack direction="row" sx={{ alignItems: 'center', gap: '8px' }}>
            {canManage && (
              <Tooltip title={job.active ? 'Turn off the recurring schedule' : 'Turn the recurring schedule back on'}>
                <Switch
                  size="small"
                  checked={job.active}
                  disabled={toggleMutation.isPending}
                  onChange={(event) => toggleMutation.mutate(event.target.checked)}
                />
              </Tooltip>
            )}
            {canManage && (
              <Tooltip title="Audit configuration">
                <Box component={RouterLink} to="/admin/configuration" sx={{ display: 'grid', placeItems: 'center', color: tokens.color.inkFaint }}>
                  <SettingsSlidersIcon />
                </Box>
              </Tooltip>
            )}
          </Stack>
        </Stack>
      </Box>

      {/* Average batch duration */}
      <Box sx={{ p: '16px 18px', border: `1px solid ${tokens.color.border}`, borderRadius: `${tokens.radius}px`, bgcolor: tokens.color.surface }}>
        <Stack direction="row" sx={{ gap: '12px' }}>
          <TimerOutlinedIcon sx={{ fontSize: 20, color: tokens.color.accent, mt: '2px' }} />
          <Box>
            <Typography sx={{ fontSize: 11.5, color: tokens.color.inkFaint, mb: '2px' }}>Average batch duration</Typography>
            <Typography sx={{ fontFamily: tokens.font.mono, fontSize: 17, fontWeight: 600 }}>
              {formatDurationMinutes(avgMinutes)}
            </Typography>
            {deltaMinutes !== null && (
              <Stack direction="row" sx={{ alignItems: 'center', gap: '4px', mt: '2px' }}>
                {deltaMinutes >= 0 ? (
                  <TrendingDownIcon sx={{ fontSize: 14, color: tokens.color.success }} />
                ) : null}
                <Typography sx={{ fontSize: 11.5, color: deltaMinutes >= 0 ? tokens.color.success : tokens.color.high }}>
                  {deltaMinutes >= 0
                    ? `${formatDurationMinutes(Math.abs(deltaMinutes))} faster`
                    : `${formatDurationMinutes(Math.abs(deltaMinutes))} slower`}
                </Typography>
                <Typography sx={{ fontSize: 11.5, color: tokens.color.inkFaint }}>than the prior runs</Typography>
              </Stack>
            )}
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}

/** Small inline sliders glyph — avoids pulling in a whole icon just for this one spot. */
function SettingsSlidersIcon() {
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      sx={{ width: 18, height: 18, fill: 'none', stroke: 'currentColor', strokeWidth: 1.8 }}
    >
      <path d="M4 6h10M17 6h3M4 12h3M9 12h11M4 18h13M20 18h0" strokeLinecap="round" />
      <circle cx="14" cy="6" r="2" fill="currentColor" stroke="none" />
      <circle cx="6" cy="12" r="2" fill="currentColor" stroke="none" />
      <circle cx="17" cy="18" r="2" fill="currentColor" stroke="none" />
    </Box>
  );
}
