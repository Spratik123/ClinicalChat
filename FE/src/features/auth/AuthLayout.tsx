import type { ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import { AuditHeroGraphic } from './AuditHeroGraphic';
import { tokens } from '@/theme/tokens';

const WORDMARK = 'CLINIC CHAT';
const TAGLINE = 'CONVERSATION AUDIT & CONTINUOUS IMPROVEMENT';

/**
 * Split-screen shell for every auth screen: brand and illustration on the
 * left, the form on the right, joined by a hairline with a badge on it.
 *
 * Below `md` the brand panel is dropped entirely and a compact wordmark sits
 * above the form — the illustration is decorative, and on a narrow viewport it
 * would push the form below the fold.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1.75fr 1fr' },
        background: tokens.gradient.formPanel,
      }}
    >
      {/* ---------------------------- Brand panel ---------------------------- */}
      <Stack
        sx={{
          display: { xs: 'none', md: 'flex' },
          justifyContent: 'center',
          alignItems: 'center',
          px: 6,
          py: 8,
          background: tokens.gradient.brandPanel,
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 820, textAlign: 'center' }}>
          <Typography
            component="h1"
            sx={{
              fontFamily: tokens.font.serif,
              fontWeight: 700,
              color: tokens.color.accent,
              // Scales with the viewport so the wordmark keeps the reference's
              // presence on a 1280 laptop and a 2560 monitor alike.
              fontSize: 'clamp(2.4rem, 4.6vw, 4.2rem)',
              lineHeight: 1.02,
              letterSpacing: '0.06em',
            }}
          >
            {WORDMARK}
          </Typography>

          <Typography
            sx={{
              mt: 1.5,
              fontFamily: tokens.font.sans,
              fontWeight: 600,
              fontSize: 'clamp(0.66rem, 0.82vw, 0.8rem)',
              letterSpacing: '0.2em',
              color: tokens.blue[500],
            }}
          >
            {TAGLINE}
          </Typography>

          <Box sx={{ mt: { md: 4, lg: 5 }, px: { md: 0, lg: 3 } }}>
            <AuditHeroGraphic />
          </Box>
        </Box>
      </Stack>

      {/* ---------------------------- Form panel ---------------------------- */}
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          px: { xs: 3, sm: 6, md: 5, lg: 6 },
          py: { xs: 5, md: 6 },
          borderLeft: { md: `1px solid ${tokens.color.border}` },
          background: tokens.gradient.formPanel,
        }}
      >
        {/* Badge straddling the divider */}
        <Box
          aria-hidden
          sx={{
            display: { xs: 'none', md: 'grid' },
            placeItems: 'center',
            position: 'absolute',
            top: '50%',
            left: 0,
            transform: 'translate(-50%, -50%)',
            width: 46,
            height: 46,
            borderRadius: '50%',
            bgcolor: tokens.color.surface,
            border: `1px solid ${tokens.color.border}`,
            boxShadow: '0 4px 14px rgba(22,27,34,0.08)',
            color: tokens.color.accent,
            zIndex: 1,
          }}
        >
          <FactCheckOutlinedIcon sx={{ fontSize: 21 }} />
        </Box>

        {/* Compact wordmark for narrow viewports, where the brand panel is hidden */}
        <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 4, textAlign: 'center' }}>
          <Typography
            component="h1"
            sx={{
              fontFamily: tokens.font.serif,
              fontWeight: 700,
              fontSize: '1.9rem',
              letterSpacing: '0.06em',
              color: tokens.color.accent,
            }}
          >
            {WORDMARK}
          </Typography>
          <Typography
            sx={{
              mt: 0.75,
              fontWeight: 600,
              fontSize: '0.6rem',
              letterSpacing: '0.18em',
              color: tokens.blue[500],
            }}
          >
            {TAGLINE}
          </Typography>
        </Box>

        <Box sx={{ width: '100%', maxWidth: 420, mx: 'auto', flex: { md: 1 }, display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: '100%' }}>{children}</Box>
        </Box>

        <Typography
          sx={{
            mt: 5,
            textAlign: 'center',
            fontSize: 12,
            color: tokens.color.inkFaint,
          }}
        >
          © {new Date().getFullYear()} Clinic Chat. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}

/** Shared heading block so every auth screen sets its title identically. */
export function AuthHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <Box sx={{ mb: 3.5 }}>
      <Typography
        component="h2"
        sx={{ fontFamily: tokens.font.serif, fontWeight: 700, fontSize: '1.72rem', color: tokens.color.ink }}
      >
        {title}
      </Typography>
      <Typography sx={{ mt: 0.75, fontSize: 14, color: tokens.color.inkMuted }}>{subtitle}</Typography>
    </Box>
  );
}
