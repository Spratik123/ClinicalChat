import type { SxProps, Theme } from '@mui/material/styles';
import { tokens } from '@/theme/tokens';

/**
 * Auth-screen field and button styling.
 *
 * These deliberately depart from the app-chrome defaults in `theme.ts`: the
 * reference design uses tall white fields and a full-pill primary button, which
 * suit a single focused form but would be too heavy for the dense data screens
 * behind the login. Scoped here rather than pushed into the global theme.
 */

export const authFieldSx: SxProps<Theme> = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    bgcolor: tokens.color.surface,
    '& fieldset': { borderColor: tokens.color.border },
    '&:hover fieldset': { borderColor: tokens.blue[300] },
    '&.Mui-focused fieldset': { borderColor: tokens.color.accent, borderWidth: '1.5px' },
  },
  '& .MuiOutlinedInput-input': {
    padding: '17px 16px',
    fontSize: 15,
  },
  '& .MuiInputLabel-root': {
    fontSize: 15,
    fontWeight: 400,
    color: tokens.color.inkMuted,
    '&.Mui-focused': { color: tokens.color.accent, fontWeight: 600 },
  },
  // Keep the shrunk label aligned with the taller input.
  '& .MuiInputLabel-outlined': {
    transform: 'translate(16px, 17px) scale(1)',
    '&.MuiInputLabel-shrink': { transform: 'translate(15px, -8px) scale(0.8)' },
  },
};

export const authSubmitSx: SxProps<Theme> = {
  borderRadius: 999,
  height: 52,
  fontSize: 15,
  fontWeight: 700,
  boxShadow: 'none',
  '&:hover': { boxShadow: 'none' },
};
