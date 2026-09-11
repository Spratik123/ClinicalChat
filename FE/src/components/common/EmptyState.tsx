import type { ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Stack sx={{ alignItems: 'center', gap: 1, p: '48px 20px', textAlign: 'center' }}>
      <Typography variant="h4">{title}</Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 380 }}>
          {description}
        </Typography>
      )}
      {action && <Box sx={{ mt: 1 }}>{action}</Box>}
    </Stack>
  );
}
