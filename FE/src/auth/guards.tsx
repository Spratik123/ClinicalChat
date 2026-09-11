import { Navigate, Outlet, useLocation } from 'react-router';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from './useAuth';
import { can, type Permission } from './roles';

function FullPageSpinner() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <CircularProgress size={28} />
    </Box>
  );
}

/**
 * Blocks a route until a session exists. Remembers where the user was headed so
 * sign-in can return them there.
 */
export function RequireAuth() {
  const { stage } = useAuth();
  const location = useLocation();

  if (stage === 'loading') return <FullPageSpinner />;
  if (stage === 'awaiting_mfa') return <Navigate to="/login/verify" replace />;
  if (stage !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return <Outlet />;
}

/** Keeps an authenticated user off the login screens. */
export function RequireAnonymous() {
  const { stage } = useAuth();
  if (stage === 'loading') return <FullPageSpinner />;
  if (stage === 'authenticated') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

/**
 * Capability gate for a route subtree. Renders 403 rather than redirecting, so
 * a shared link tells the recipient they lack access instead of silently
 * bouncing them to a dashboard.
 */
export function RequirePermission({ permission }: { permission: Permission }) {
  const { user } = useAuth();
  if (!can(user?.role, permission)) return <Navigate to="/403" replace />;
  return <Outlet />;
}
