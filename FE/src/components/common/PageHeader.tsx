import type { ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';

interface PageHeaderProps {
  title: string;
  /** One or two sentences of orientation. Kept short — reviewers read these once. */
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <Stack
      direction="row"
      sx={{ alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, mb: '20px' }}
    >
      <Box>
        <Typography variant="h1">{title}</Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: '5px', maxWidth: 640 }}>
            {description}
          </Typography>
        )}
      </Box>
      {actions && (
        <Stack direction="row" sx={{ gap: 1 }}>
          {actions}
        </Stack>
      )}
    </Stack>
  );
}
