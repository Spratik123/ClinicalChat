import { useState, type FormEvent } from 'react';
import { Link as RouterLink } from 'react-router';
import { Alert, Box, Button, Link, Stack, TextField, Typography } from '@mui/material';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { authApi } from '@/api/backend/services';
import { tokens } from '@/theme/tokens';
import { AuthHeading, AuthLayout } from './AuthLayout';
import { authFieldSx, authSubmitSx } from './authStyles';

const MIN_PASSWORD_LENGTH = 8;

type Step = 'request' | 'confirm' | 'done';

/**
 * Self-service password reset in two steps: request a code by email, then set a
 * new password with that code. The request step never reveals whether the
 * address has an account — the API answers identically either way, and so does
 * this screen — so staff accounts on a PHI-bearing platform cannot be enumerated.
 */
export function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const requestCode = async (event?: FormEvent) => {
    event?.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      await authApi.forgotPassword({ email: email.trim() });
      setStep('confirm');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not send the reset code.');
    } finally {
      setSubmitting(false);
    }
  };

  const resendCode = async () => {
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      await authApi.forgotPassword({ email: email.trim() });
      setNotice('If an account exists, a new code is on its way.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not send a new code.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmReset = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Use at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await authApi.confirmForgotPassword({ email: email.trim(), code: code.trim(), new_password: password });
      setStep('done');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not reset your password.');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'done') {
    return (
      <AuthLayout>
        <Box sx={{ textAlign: 'center' }}>
          <IconBadge>
            <CheckCircleOutlineIcon />
          </IconBadge>
          <Typography component="h2" sx={{ fontFamily: tokens.font.serif, fontWeight: 700, fontSize: '1.6rem' }}>
            Password updated
          </Typography>
          <Typography sx={{ mt: 1.25, fontSize: 14, color: tokens.color.inkMuted }}>
            You can now sign in with your new password.
          </Typography>
          <Button component={RouterLink} to="/login" variant="contained" fullWidth sx={{ ...authSubmitSx, mt: 4 }}>
            Back to sign in
          </Button>
        </Box>
      </AuthLayout>
    );
  }

  if (step === 'confirm') {
    return (
      <AuthLayout>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <IconBadge>
            <MarkEmailReadOutlinedIcon />
          </IconBadge>
          <Typography component="h2" sx={{ fontFamily: tokens.font.serif, fontWeight: 700, fontSize: '1.6rem' }}>
            Check your email
          </Typography>
          <Typography sx={{ mt: 1.25, fontSize: 14, color: tokens.color.inkMuted }}>
            If an account exists for <b>{email}</b>, we&apos;ve sent a reset code. Enter it below with a new password.
          </Typography>
        </Box>

        <Box component="form" onSubmit={confirmReset} noValidate>
          <Stack sx={{ gap: 2 }}>
            {error && <Alert severity="error">{error}</Alert>}
            {notice && <Alert severity="info">{notice}</Alert>}

            <TextField
              label="Reset code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              autoComplete="one-time-code"
              autoFocus
              required
              fullWidth
              sx={authFieldSx}
            />
            <TextField
              label="New password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              required
              fullWidth
              sx={authFieldSx}
            />
            <TextField
              label="Confirm new password"
              type="password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              autoComplete="new-password"
              required
              fullWidth
              sx={authFieldSx}
            />

            <Typography sx={{ fontSize: 12.5, color: tokens.color.inkMuted }}>
              At least {MIN_PASSWORD_LENGTH} characters. Your organisation&apos;s password policy may require more.
            </Typography>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={!code.trim() || !password || !confirm || submitting}
              sx={authSubmitSx}
            >
              {submitting ? 'Saving…' : 'Set new password'}
            </Button>
          </Stack>
        </Box>

        <Stack direction="row" sx={{ mt: 3, justifyContent: 'space-between' }}>
          <Link component="button" type="button" onClick={() => void resendCode()} disabled={submitting} sx={linkSx}>
            Send a new code
          </Link>
          <Link
            component="button"
            type="button"
            onClick={() => {
              setError(null);
              setNotice(null);
              setStep('request');
            }}
            sx={linkSx}
          >
            Use a different email
          </Link>
        </Stack>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthHeading
        title="Reset your password"
        subtitle="Enter your work email and we'll send you a code to set a new one."
      />

      <Box component="form" onSubmit={requestCode} noValidate>
        <Stack sx={{ gap: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Work email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            required
            fullWidth
            sx={authFieldSx}
          />

          <Button type="submit" variant="contained" fullWidth disabled={!email.trim() || submitting} sx={authSubmitSx}>
            {submitting ? 'Sending…' : 'Send reset code'}
          </Button>
        </Stack>
      </Box>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Link
          component={RouterLink}
          to="/login"
          sx={{ fontSize: 13.5, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
        >
          <ArrowBackIcon sx={{ fontSize: 16 }} />
          Back to sign in
        </Link>
      </Box>
    </AuthLayout>
  );
}

const linkSx = { fontSize: 13.5, fontWeight: 600 } as const;

function IconBadge({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        placeItems: 'center',
        width: 56,
        height: 56,
        mx: 'auto',
        mb: 2.5,
        borderRadius: '50%',
        bgcolor: tokens.color.accentTint,
        color: tokens.color.accent,
      }}
    >
      {children}
    </Box>
  );
}
