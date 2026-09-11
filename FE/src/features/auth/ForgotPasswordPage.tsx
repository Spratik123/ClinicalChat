import { useState, type FormEvent } from 'react';
import { Link as RouterLink } from 'react-router';
import { Alert, Box, Button, Link, Stack, TextField, Typography } from '@mui/material';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { api } from '@/api/client';
import { tokens } from '@/theme/tokens';
import { AuthHeading, AuthLayout } from './AuthLayout';
import { authFieldSx, authSubmitSx } from './authStyles';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not send the reset link.');
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout>
        <Box sx={{ textAlign: 'center' }}>
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
            <MarkEmailReadOutlinedIcon />
          </Box>

          <Typography
            component="h2"
            sx={{ fontFamily: tokens.font.serif, fontWeight: 700, fontSize: '1.6rem' }}
          >
            Check your email
          </Typography>

          {/*
            Deliberately does not confirm whether the address has an account —
            that would let anyone enumerate staff on a PHI-bearing platform.
          */}
          <Typography sx={{ mt: 1.25, fontSize: 14, color: tokens.color.inkMuted }}>
            If an account exists for <b>{email}</b>, we've sent a link to reset its password. The
            link expires in 30 minutes.
          </Typography>

          <Button
            component={RouterLink}
            to="/login"
            variant="contained"
            fullWidth
            sx={{ ...authSubmitSx, mt: 4 }}
          >
            Back to sign in
          </Button>
        </Box>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthHeading
        title="Reset your password"
        subtitle="Enter your work email and we'll send you a link to set a new one."
      />

      <Box component="form" onSubmit={handleSubmit} noValidate>
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

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={!email.trim() || submitting}
            sx={authSubmitSx}
          >
            {submitting ? 'Sending…' : 'Send reset link'}
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
