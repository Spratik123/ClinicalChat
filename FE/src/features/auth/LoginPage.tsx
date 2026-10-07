import { useState, type FormEvent } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router';
import {
  Alert,
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { useAuth } from '@/auth/useAuth';
import { tokens } from '@/theme/tokens';
import { AuthHeading, AuthLayout } from './AuthLayout';
import { authFieldSx, authSubmitSx } from './authStyles';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      // A first-time login moves auth into the set-password stage; send the user
      // to that step. Otherwise the session is live and we continue on.
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? '/dashboard', { replace: true, state: location.state });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Sign-in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <AuthHeading title="Welcome back" subtitle="Sign in to pick up where you left off." />

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack sx={{ gap: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            required
            fullWidth
            sx={authFieldSx}
          />

          <Box>
            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              fullWidth
              sx={authFieldSx}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((current) => !current)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? (
                          <VisibilityOffOutlinedIcon sx={{ fontSize: 20 }} />
                        ) : (
                          <VisibilityOutlinedIcon sx={{ fontSize: 20 }} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            {/* Invited users receive a temporary password — there is no public
                sign-up, so this is the normal first-time path. */}
            <Typography sx={{ mt: 1, fontSize: 12.5, color: tokens.color.inkMuted }}>
              Just invited? Use the temporary password we emailed you.
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'right' }}>
            <Link component={RouterLink} to="/login/forgot" sx={{ fontSize: 13.5, fontWeight: 600 }}>
              Forgot your password?
            </Link>
          </Box>

          <Button type="submit" variant="contained" fullWidth disabled={submitting} sx={authSubmitSx}>
            {submitting ? 'Checking…' : 'Sign in'}
          </Button>
        </Stack>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/*
        The reference design offers self-registration here. This platform does
        not: access is role-based and granted by invitation from an Owner /
        Admin (BRD 11), so a public sign-up route would hand anyone an account
        on a PHI-bearing system.
      */}
      <Typography sx={{ textAlign: 'center', fontSize: 13.5, color: tokens.color.inkMuted }}>
        Need access? Ask an Owner / Admin to invite you — accounts are assigned a role, and every
        access change is logged.
      </Typography>

      <Typography
        sx={{
          mt: 2.5,
          textAlign: 'center',
          fontSize: 11.5,
          color: tokens.color.inkFaint,
          lineHeight: 1.6,
        }}
      >
        Access is logged for HIPAA/SOC-2 compliance
      </Typography>
    </AuthLayout>
  );
}
