import { Box, Button, Stack, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { Link as RouterLink } from 'react-router';
import { onboardingOrder, onboardingStepMeta } from '@/config/onboarding';
import { can } from '@/auth/roles';
import { useAuth } from '@/auth/useAuth';
import { tokens } from '@/theme/tokens';
import type { OnboardingStep } from '@/types/domain';

/**
 * Setup checklist from the prototype — invite the team, set the configuration,
 * work the queue.
 *
 * Hidden once every step is complete: a permanently-pinned checklist of ticks
 * costs the operator screen space and tells them nothing.
 */
export function OnboardingCard({ steps }: { steps: OnboardingStep[] }) {
  const { user } = useAuth();

  const byId = new Map(steps.map((step) => [step.id, step]));
  const ordered = onboardingOrder.map((id) => byId.get(id)).filter((step): step is OnboardingStep => Boolean(step));

  if (ordered.length === 0 || ordered.every((step) => step.complete)) return null;

  return (
    <Box
      sx={{
        mb: '18px',
        p: '22px 24px',
        borderRadius: `${tokens.radius}px`,
        color: '#fff',
        background: `linear-gradient(135deg, ${tokens.color.accent} 0%, ${tokens.blue[600]} 100%)`,
      }}
    >
      <Typography variant="h3" sx={{ color: '#fff', mb: 0.5 }}>
        Getting Clinic Chat Audit running
      </Typography>
      <Typography sx={{ color: tokens.blue[200], fontSize: 13, mb: 2.5, maxWidth: 600 }}>
        Three steps to a working audit loop. The audit runs on a schedule; people decide what
        reaches the live bot.
      </Typography>

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        sx={{ gap: { xs: 2.5, md: 0 }, alignItems: 'stretch' }}
      >
        {ordered.map((step, index) => {
          const meta = onboardingStepMeta[step.id];
          const showAction = can(user?.role, meta.permission);
          const isLast = index === ordered.length - 1;

          return (
            <Box
              key={step.id}
              sx={{
                flex: 1,
                position: 'relative',
                pr: { md: '14px' },
                // Connector between steps, matching the prototype.
                '&::after': isLast
                  ? undefined
                  : {
                      content: '""',
                      display: { xs: 'none', md: 'block' },
                      position: 'absolute',
                      top: 13,
                      right: 0,
                      width: 14,
                      // '1px', not 1 — MUI's sizing transform reads numeric
                      // width/height <= 1 as a percentage, so `height: 1`
                      // would render a full-height bar.
                      height: '1px',
                      bgcolor: 'rgba(255,255,255,0.28)',
                    },
              }}
            >
              <Box
                sx={{
                  width: 26,
                  height: 26,
                  mb: 1.25,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  fontFamily: tokens.font.mono,
                  fontSize: 12,
                  fontWeight: 600,
                  border: '1px solid',
                  ...(step.complete
                    ? { bgcolor: '#fff', color: tokens.color.accent, borderColor: '#fff' }
                    : { bgcolor: 'rgba(255,255,255,0.14)', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }),
                }}
              >
                {step.complete ? <CheckIcon sx={{ fontSize: 15 }} /> : index + 1}
              </Box>

              <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: '#fff' }}>
                {index + 1}. {meta.title}
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: tokens.blue[300] }}>{step.detail}</Typography>

              {showAction && (
                <Button
                  component={RouterLink}
                  to={meta.to}
                  variant="text"
                  sx={{
                    mt: 0.5,
                    p: 0,
                    minWidth: 0,
                    fontSize: 11.5,
                    fontWeight: 500,
                    color: '#fff',
                    textDecoration: 'underline',
                    textUnderlineOffset: '2px',
                    '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
                  }}
                >
                  {meta.actionLabel}
                </Button>
              )}
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
