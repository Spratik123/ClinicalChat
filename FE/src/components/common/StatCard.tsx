import type { ReactNode } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { tokens } from '@/theme/tokens';

interface StatCardProps {
  label: string;
  value: ReactNode;
  /** Context line under the number — comparison, target, or breakdown. */
  foot?: ReactNode;
  tone?: 'default' | 'safety' | 'success' | 'warn';
}

const toneColor = {
  default: undefined,
  safety: tokens.color.safety,
  success: tokens.color.success,
  warn: tokens.color.high,
} as const;

export function StatCard({ label, value, foot, tone = 'default' }: StatCardProps) {
  return (
    <Paper variant="outlined" sx={{ p: '16px 18px' }}>
      <Typography sx={{ fontSize: 12, color: tokens.color.inkMuted, mb: '8px' }}>{label}</Typography>
      <Box
        sx={{
          fontFamily: tokens.font.serif,
          fontSize: 28,
          fontWeight: 600,
          lineHeight: 1,
          color: toneColor[tone],
        }}
      >
        {value}
      </Box>
      {/* A div, not a Typography: callers pass block content here (the cost-burn
          card renders a progress bar), which is invalid inside a <p>. */}
      {foot && <Box sx={{ fontSize: 12, color: tokens.color.inkFaint, mt: '8px' }}>{foot}</Box>}
    </Paper>
  );
}
