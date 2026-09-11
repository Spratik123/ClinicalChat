import { Box, Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink, useRouteError } from 'react-router';
import { tokens } from '@/theme/tokens';

function CenteredMessage({
  code,
  title,
  description,
}: {
  code: string;
  title: string;
  description: string;
}) {
  return (
    <Stack
      sx={{
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5,
        minHeight: '60vh',
        textAlign: 'center',
      }}
    >
      <Box sx={{ fontFamily: tokens.font.mono, fontSize: 13, color: tokens.color.inkFaint }}>{code}</Box>
      <Typography variant="h1">{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
        {description}
      </Typography>
      <Button component={RouterLink} to="/dashboard" variant="contained" sx={{ mt: 1 }}>
        Back to overview
      </Button>
    </Stack>
  );
}

export function NotFoundPage() {
  return (
    <CenteredMessage
      code="404"
      title="Page not found"
      description="That route does not exist in the audit platform."
    />
  );
}

export function ForbiddenPage() {
  return (
    <CenteredMessage
      code="403"
      title="No access with your role"
      description="This area is restricted. Ask an Owner / Admin if you need access — role changes are logged."
    />
  );
}

/** Router-level error boundary, so a render crash doesn't blank the app. */
export function RouteErrorPage() {
  const error = useRouteError();
  const message = error instanceof Error ? error.message : 'An unexpected error occurred.';

  return (
    <CenteredMessage
      code="error"
      title="Something broke rendering this view"
      description={message}
    />
  );
}
