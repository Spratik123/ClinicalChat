import { createTheme } from '@mui/material/styles';
import { tokens } from './tokens';

/**
 * MUI theme that re-skins Material to the client prototype's design language:
 * serif headings, 6px radius, flat dense tables, pill badges.
 *
 * We keep MUI's *behaviour* (accessible dialogs, selects, tooltips, DataGrid)
 * and override its *appearance* here so the client's reviewed design survives.
 */
export const theme = createTheme({
  cssVariables: true,

  shape: {
    borderRadius: tokens.radius,
  },

  palette: {
    mode: 'light',
    primary: {
      main: tokens.color.accent,
      dark: tokens.color.accentInk,
      light: tokens.color.accentTint,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: tokens.color.teal,
      dark: tokens.color.tealInk,
      light: tokens.color.tealTint,
      contrastText: '#FFFFFF',
    },
    error: {
      // Ordinary error/urgency. Safety red is deliberately NOT wired into the
      // palette so it cannot be reached by `color="error"`; see SeverityBadge.
      main: tokens.color.high,
      light: tokens.color.highTint,
    },
    warning: {
      main: tokens.color.medium,
      light: tokens.color.mediumTint,
    },
    success: {
      main: tokens.color.success,
      light: tokens.color.successTint,
    },
    background: {
      default: tokens.color.bg,
      paper: tokens.color.surface,
    },
    text: {
      primary: tokens.color.ink,
      secondary: tokens.color.inkMuted,
      disabled: tokens.color.inkFaint,
    },
    divider: tokens.color.border,
  },

  typography: {
    fontFamily: tokens.font.sans,
    fontSize: 14,
    htmlFontSize: 16,

    h1: { fontFamily: tokens.font.serif, fontWeight: 600, fontSize: '1.714rem', lineHeight: 1.25 },
    h2: { fontFamily: tokens.font.serif, fontWeight: 600, fontSize: '1.286rem', lineHeight: 1.3 },
    h3: { fontFamily: tokens.font.serif, fontWeight: 600, fontSize: '1.071rem', lineHeight: 1.35 },
    h4: { fontFamily: tokens.font.serif, fontWeight: 600, fontSize: '0.964rem', lineHeight: 1.4 },

    subtitle1: { fontSize: '0.964rem', fontWeight: 600 },
    subtitle2: { fontSize: '0.893rem', fontWeight: 600, color: tokens.color.inkMuted },
    body1: { fontSize: '0.964rem', lineHeight: 1.55 },
    body2: { fontSize: '0.929rem', lineHeight: 1.55 },
    caption: { fontSize: '0.857rem', color: tokens.color.inkFaint, lineHeight: 1.5 },
    button: { fontSize: '0.964rem', fontWeight: 600, textTransform: 'none' },
    overline: {
      fontSize: '0.786rem',
      fontWeight: 600,
      letterSpacing: '0.02em',
      textTransform: 'none',
      color: tokens.color.inkFaint,
    },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          WebkitFontSmoothing: 'antialiased',
          backgroundColor: tokens.color.bg,
        },
        ':focus-visible': {
          outline: `2px solid ${tokens.color.focus}`,
          outlineOffset: 2,
        },
      },
    },

    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 7, padding: '8px 16px' },
        sizeSmall: { padding: '5px 11px', fontSize: '0.893rem' },
        outlined: {
          borderColor: tokens.color.borderStrong,
          color: tokens.color.ink,
          '&:hover': { borderColor: tokens.color.borderStrong, background: tokens.color.surfaceSunk },
        },
      },
    },

    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: 'none' },
        outlined: { borderColor: tokens.color.border },
      },
    },

    MuiCard: {
      defaultProps: { variant: 'outlined' },
    },

    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 20, fontWeight: 600, fontSize: '0.786rem', height: 22 },
        label: { paddingLeft: 9, paddingRight: 9 },
      },
    },

    // Flat, dense, prototype-style tables.
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${tokens.color.border}`,
          fontSize: '0.929rem',
          padding: '12px 16px',
        },
        head: {
          fontSize: '0.821rem',
          fontWeight: 600,
          color: tokens.color.inkMuted,
          background: tokens.color.surfaceSunk,
          padding: '9px 16px',
          whiteSpace: 'nowrap',
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: { '&:last-child td': { borderBottom: 'none' } },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 7, background: tokens.color.surface },
        notchedOutline: { borderColor: tokens.color.borderStrong },
      },
    },

    MuiSelect: {
      styleOverrides: {
        select: { fontSize: '0.893rem' },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: { fontSize: '0.893rem', fontWeight: 600, color: tokens.color.inkMuted },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 8, boxShadow: tokens.shadow.pop },
      },
    },

    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontFamily: tokens.font.serif,
          fontSize: '1.143rem',
          padding: '18px 22px',
          borderBottom: `1px solid ${tokens.color.border}`,
        },
      },
    },

    MuiDialogContent: { styleOverrides: { root: { padding: '20px 22px' } } },

    MuiDialogActions: {
      styleOverrides: {
        root: { padding: '16px 22px', borderTop: `1px solid ${tokens.color.border}`, gap: 10 },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: { background: tokens.color.ink, fontSize: '0.821rem', borderRadius: 4 },
      },
    },

    MuiLink: {
      defaultProps: { underline: 'hover' },
      styleOverrides: { root: { color: tokens.color.teal, fontWeight: 500 } },
    },

    MuiDrawer: {
      styleOverrides: {
        paper: { boxShadow: tokens.shadow.pop },
      },
    },

    // Segmented-pill tabs (Review queue's "Needs review" / "Recently
    // reviewed") rather than MUI's default underline indicator.
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 36,
          background: tokens.color.surfaceSunk,
          borderRadius: 8,
          padding: 3,
          border: `1px solid ${tokens.color.border}`,
        },
        indicator: { display: 'none' },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 30,
          padding: '5px 14px',
          fontSize: '0.857rem',
          fontWeight: 600,
          textTransform: 'none',
          color: tokens.color.inkMuted,
          borderRadius: 6,
          '&.Mui-selected': {
            color: tokens.color.ink,
            background: tokens.color.surface,
            boxShadow: '0 1px 2px rgba(10,20,22,0.08)',
          },
        },
      },
    },

    MuiAccordion: {
      defaultProps: { disableGutters: true, elevation: 0 },
      styleOverrides: {
        root: {
          border: `1px solid ${tokens.color.border}`,
          borderRadius: '8px !important',
          '&:before': { display: 'none' },
          '&:not(:last-of-type)': { marginBottom: 10 },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: { minHeight: 44, padding: '0 14px' },
        content: { margin: '10px 0', fontSize: '0.893rem', fontWeight: 600 },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: { padding: '0 14px 14px', borderTop: `1px solid ${tokens.color.border}` },
      },
    },
  },
});
