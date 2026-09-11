import { Alert, Snackbar, Stack } from '@mui/material';
import { useUiStore } from '@/stores/uiStore';
import { tokens } from '@/theme/tokens';

/** Renders queued toasts bottom-right, matching the prototype. */
export function ToastHost() {
  const toasts = useUiStore((state) => state.toasts);
  const dismissToast = useUiStore((state) => state.dismissToast);

  return (
    <Snackbar open={toasts.length > 0} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
      <Stack sx={{ gap: 1.25 }}>
        {toasts.map((toast) => (
          <Alert
            key={toast.id}
            onClose={() => dismissToast(toast.id)}
            variant="filled"
            icon={false}
            sx={{
              minWidth: 260,
              bgcolor:
                toast.tone === 'success'
                  ? tokens.color.success
                  : toast.tone === 'safety'
                    ? tokens.color.safety
                    : tokens.color.ink,
              color: '#fff',
              boxShadow: tokens.shadow.pop,
            }}
          >
            {toast.message}
          </Alert>
        ))}
      </Stack>
    </Snackbar>
  );
}
