import type { ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import { tokens } from '@/theme/tokens';
import { formatCount, formatDurationMinutes, formatRelative } from '@/utils/format';
import type { QueueResponse } from '@/types/domain';

/**
 * Queue health strip — every number here is the unfiltered, whole-queue
 * figure (from the `/queue` response's aggregate fields), not affected by
 * whatever tab or filter is currently narrowing the list below it.
 */
export function QueueStatStrip({ data }: { data: QueueResponse }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: { xs: 2, md: 0 },
        p: '14px 18px',
        mb: '18px',
        border: `1px solid ${tokens.color.border}`,
        borderRadius: `${tokens.radius}px`,
        bgcolor: tokens.color.surface,
      }}
    >
      <StatItem
        icon={<ErrorOutlineIcon sx={{ fontSize: 17, color: tokens.color.safety }} />}
        label="Critical signals"
        value={data.totalSafety > 0 ? `${formatCount(data.totalSafety)} need attention` : 'None open'}
      />
      <Divider />
      <StatItem
        icon={<ScheduleOutlinedIcon sx={{ fontSize: 17, color: tokens.color.inkFaint }} />}
        label="Median review age"
        value={data.totalOpen > 0 ? formatDurationMinutes(data.medianOpenAgeMinutes) : '—'}
      />
      <Divider />
      <StatItem
        icon={<CheckCircleOutlineIcon sx={{ fontSize: 17, color: tokens.color.success }} />}
        label="Today's throughput"
        value={`${formatCount(data.decidedToday)} decided`}
      />

      <Box sx={{ ml: { md: 'auto' }, textAlign: { xs: 'left', md: 'right' } }}>
        <Typography sx={{ fontSize: 11, color: tokens.color.inkFaint }}>Last synced</Typography>
        <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>{formatRelative(data.asOf)}</Typography>
      </Box>
    </Box>
  );
}

function StatItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Stack direction="row" sx={{ alignItems: 'center', gap: '10px', px: { md: '20px' }, '&:first-of-type': { pl: 0 } }}>
      <Box sx={{ display: 'grid', placeItems: 'center' }}>{icon}</Box>
      <Box>
        <Typography sx={{ fontSize: 11, color: tokens.color.inkFaint }}>{label}</Typography>
        <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>{value}</Typography>
      </Box>
    </Stack>
  );
}

function Divider() {
  return (
    <Box
      sx={{
        display: { xs: 'none', md: 'block' },
        width: '1px',
        alignSelf: 'stretch',
        bgcolor: tokens.color.border,
      }}
    />
  );
}
