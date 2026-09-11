import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import { tokens } from '@/theme/tokens';

/**
 * Monospace inline text. Use for anything a reviewer might compare
 * character-by-character or paste into a ticket: turn IDs, finding IDs, intent
 * names, confidences, participant hashes, snapshot IDs, cost figures.
 */
export function Mono({ children, dim = false }: { children: ReactNode; dim?: boolean }) {
  return (
    <Box
      component="span"
      sx={{
        fontFamily: tokens.font.mono,
        fontSize: '0.929em',
        color: dim ? tokens.color.inkFaint : 'inherit',
      }}
    >
      {children}
    </Box>
  );
}
