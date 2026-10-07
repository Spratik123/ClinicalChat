import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { Alert, Box, Button, Link, Stack, TextField, Typography } from '@mui/material';
import { useAuth } from '@/auth/useAuth';
import { tokens } from '@/theme/tokens';
import { AuthHeading, AuthLayout } from './AuthLayout';
import { authFieldSx, authSubmitSx } from './authStyles';

const MIN_LENGTH = 8;

/**
 * First-login step: Cognito requires an invited user to replace the temporary
 * password before it issues a session.
 */
export function NewPasswordPage() {
  const { stage, challenge, completeNewPassword, cancelChallenge } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Landing here without a challenge in progress means a refresh or a stale link.
  if (stage !== 'awaiting_new_password' || !challenge) {
    return <Navigate to={stage === 'authenticated' ? '/dashboard' : '/login'} replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password.length < MIN_LENGTH) {
      setError(`Use at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await completeNewPassword(password);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? '/dashboard', { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not set your password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <AuthHeading
        title="Set your password"
        subtitle={`Choose a new password for ${challenge.email} to finish signing in.`}
      />

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack sx={{ gap: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="New password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            autoFocus
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
            At least {MIN_LENGTH} characters. Your organisation&apos;s password policy may require more.
          </Typography>

          <Button type="submit" variant="contained" fullWidth disabled={submitting} sx={authSubmitSx}>
            {submitting ? 'Saving…' : 'Set password and sign in'}
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <Link
              component="button"
              type="button"
              onClick={() => {
                cancelChallenge();
                navigate('/login', { replace: true });
              }}
              sx={{ fontSize: 13.5, fontWeight: 600 }}
            >
              Back to sign in
            </Link>
          </Box>
        </Stack>
      </Box>
    </AuthLayout>
  );
}
