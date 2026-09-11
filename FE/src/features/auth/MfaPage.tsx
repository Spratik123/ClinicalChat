import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { Alert, Box, Button, Link, Stack, Typography } from '@mui/material';
import { useAuth } from '@/auth/useAuth';
import { roleLabels } from '@/auth/roles';
import { tokens } from '@/theme/tokens';
import { AuthHeading, AuthLayout } from './AuthLayout';
import { authSubmitSx } from './authStyles';

const CODE_LENGTH = 6;

export function MfaPage() {
  const { stage, pending, verifyMfa, cancelMfa } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  // Landing here without a challenge in progress means a refresh or a stale link.
  if (stage !== 'awaiting_mfa' || !pending) {
    return <Navigate to={stage === 'authenticated' ? '/dashboard' : '/login'} replace />;
  }

  const code = digits.join('');

  const setDigit = (index: number, raw: string) => {
    const value = raw.replace(/\D/g, '');
    if (!value) {
      setDigits((current) => current.map((digit, i) => (i === index ? '' : digit)));
      return;
    }

    // Support pasting the whole code into any box.
    setDigits((current) => {
      const next = [...current];
      for (let offset = 0; offset < value.length && index + offset < CODE_LENGTH; offset += 1) {
        next[index + offset] = value[offset]!;
      }
      return next;
    });

    inputsRef.current[Math.min(index + value.length, CODE_LENGTH - 1)]?.focus();
  };

  const handleKeyDown = (index: number, key: string) => {
    if (key === 'Backspace' && !digits[index] && index > 0) inputsRef.current[index - 1]?.focus();
    if (key === 'ArrowLeft' && index > 0) inputsRef.current[index - 1]?.focus();
    if (key === 'ArrowRight' && index < CODE_LENGTH - 1) inputsRef.current[index + 1]?.focus();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await verifyMfa(code);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? '/dashboard', { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Verification failed.');
      setDigits(Array(CODE_LENGTH).fill(''));
      inputsRef.current[0]?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <AuthHeading
        title="Enter your code"
        subtitle={`We sent a ${CODE_LENGTH}-digit code to your authenticator app.`}
      />

      <Box component="form" onSubmit={handleSubmit}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Stack direction="row" sx={{ gap: '10px', justifyContent: 'space-between', mb: 3 }}>
          {digits.map((digit, index) => (
            <Box
              key={index}
              component="input"
              ref={(node: HTMLInputElement | null) => {
                inputsRef.current[index] = node;
              }}
              value={digit}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setDigit(index, event.target.value)}
              onKeyDown={(event: KeyboardEvent) => handleKeyDown(index, event.key)}
              inputMode="numeric"
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              aria-label={`Digit ${index + 1} of ${CODE_LENGTH}`}
              maxLength={CODE_LENGTH}
              sx={{
                flex: 1,
                minWidth: 0,
                height: 58,
                textAlign: 'center',
                fontSize: 22,
                fontFamily: tokens.font.mono,
                color: tokens.color.ink,
                bgcolor: tokens.color.surface,
                border: `1px solid ${tokens.color.border}`,
                borderRadius: '10px',
                '&:hover': { borderColor: tokens.blue[300] },
                '&:focus': {
                  outline: 'none',
                  borderColor: tokens.color.accent,
                  borderWidth: '1.5px',
                  boxShadow: `0 0 0 3px ${tokens.color.accentTint}`,
                },
              }}
            />
          ))}
        </Stack>

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={code.length < CODE_LENGTH || submitting}
          sx={authSubmitSx}
        >
          {submitting ? 'Verifying…' : 'Verify & sign in'}
        </Button>
      </Box>

      <Typography sx={{ mt: 3, textAlign: 'center', fontSize: 13, color: tokens.color.inkMuted }}>
        Signing in as{' '}
        <Box component="b" sx={{ color: tokens.color.ink }}>
          {roleLabels[pending.role]}
        </Box>{' '}
        · {pending.name}
      </Typography>

      <Box sx={{ mt: 1, textAlign: 'center' }}>
        <Link
          component="button"
          type="button"
          onClick={() => {
            cancelMfa();
            navigate('/login', { replace: true });
          }}
          sx={{ fontSize: 13, fontWeight: 600 }}
        >
          Use a different account
        </Link>
      </Box>
    </AuthLayout>
  );
}
