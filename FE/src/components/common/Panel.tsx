import type { ReactNode } from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';
import { tokens } from '@/theme/tokens';

interface PanelProps {
  title?: string;
  /** Small note beside the title — counts, freshness, scope. */
  subtitle?: string;
  actions?: ReactNode;
  /** Remove body padding for edge-to-edge tables. */
  flush?: boolean;
  children: ReactNode;
}

export function Panel({ title, subtitle, actions, flush = false, children }: PanelProps) {
  return (
    <Paper variant="outlined" sx={{ mb: '18px' }}>
      {(title || actions) && (
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            p: '14px 18px',
            borderBottom: `1px solid ${tokens.color.border}`,
          }}
        >
          <Box>
            {title && <Typography variant="h3">{title}</Typography>}
            {subtitle && (
              <Typography sx={{ fontSize: 12, color: tokens.color.inkFaint, mt: '2px' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {actions && (
            <Stack direction="row" sx={{ gap: 1 }}>
              {actions}
            </Stack>
          )}
        </Stack>
      )}
      <Box sx={{ p: flush ? 0 : '18px', overflowX: 'auto' }}>{children}</Box>
    </Paper>
  );
}
