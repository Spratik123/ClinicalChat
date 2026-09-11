import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { theme } from '@/theme/theme';
import { queryClient } from '@/app/queryClient';
import { router } from '@/app/router';
import { ToastHost } from '@/app/ToastHost';
import { AuthProvider } from '@/auth/AuthContext';
import { env } from '@/config/env';

/** Service-worker registration can hang (headless browsers, restrictive profiles). */
const MOCK_START_TIMEOUT_MS = 4000;

/**
 * Starts MSW, but never lets it prevent the app from rendering.
 *
 * The mock layer is a development convenience, not a boot dependency: if the
 * service worker fails to register or hangs, we log it and render anyway rather
 * than showing the user a blank page.
 */
async function startMockServiceWorker(): Promise<void> {
  if (!env.useMocks) return;

  try {
    const { worker } = await import('@/mocks/browser');
    await Promise.race([
      worker.start({ onUnhandledRequest: 'bypass', quiet: false }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('MSW worker did not start in time.')), MOCK_START_TIMEOUT_MS),
      ),
    ]);
  } catch (error) {
    console.error('[mocks] Mock API unavailable — continuing without it. API calls will fail.', error);
  }
}

async function bootstrap(): Promise<void> {
  // Start MSW before the first render so no query races an unhandled request.
  await startMockServiceWorker();

  const container = document.getElementById('root');
  if (!container) throw new Error('Root element #root not found.');

  createRoot(container).render(
    <StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <RouterProvider router={router} />
            <ToastHost />
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </StrictMode>,
  );
}

void bootstrap();
