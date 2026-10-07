import { Box, Stack, Tooltip, Typography } from '@mui/material';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import { Link as RouterLink } from 'react-router';
import { usePermission } from '@/auth/useAuth';
import { tokens } from '@/theme/tokens';
import { formatCount, formatDayTime } from '@/utils/format';
import type { AuditRun, ScheduledJob } from '@/types/domain';

const cadenceLabels: Record<ScheduledJob['cadence'], string> = {
  nightly: 'Nightly',
  twelve_hourly: 'Every 12 hours',
  manual: 'Manual only',
};

export function SchedulerStatCards({ job, runs }: { job: ScheduledJob; runs: AuditRun[] }) {
  const canManage = usePermission('manageAudit');
  const finished = runs.filter((run) => run.status === 'succeeded' || run.status === 'partial');
  const avgTurns = finished.length > 0 ? finished.reduce((sum, run) => sum + run.turnsAudited, 0) / finished.length : 0;

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
                  {job.active ? `Schedule ${job.name} is enabled; the API does not report its next run time.` : 'No enabled schedule. Start a run manually.'}
                </Typography>
              )}
            </Box>
          </Stack>

          <Stack direction="row" sx={{ alignItems: 'center', gap: '8px' }}>
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

      {/* Average turns per run (the backend records no run start/finish times, so no duration) */}
      <Box sx={{ p: '16px 18px', border: `1px solid ${tokens.color.border}`, borderRadius: `${tokens.radius}px`, bgcolor: tokens.color.surface }}>
        <Stack direction="row" sx={{ gap: '12px' }}>
          <TimerOutlinedIcon sx={{ fontSize: 20, color: tokens.color.accent, mt: '2px' }} />
          <Box>
            <Typography sx={{ fontSize: 11.5, color: tokens.color.inkFaint, mb: '2px' }}>Average turns per run</Typography>
            <Typography sx={{ fontFamily: tokens.font.mono, fontSize: 17, fontWeight: 600 }}>
              {finished.length > 0 ? formatCount(Math.round(avgTurns)) : '—'}
            </Typography>
            <Typography sx={{ fontSize: 11.5, color: tokens.color.inkFaint, mt: '2px' }}>
              across {finished.length} finished run{finished.length === 1 ? '' : 's'}
            </Typography>
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
