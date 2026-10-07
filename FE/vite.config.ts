import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // The backend sends no CORS headers, so the browser talks to same-origin
  // `/api` and the dev server forwards it to the ALB's `/python` prefix.
  const proxyTarget = env.VITE_API_PROXY_TARGET;

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      strictPort: false,
      ...(proxyTarget
        ? {
            proxy: {
              '/api': {
                target: proxyTarget,
                changeOrigin: true,
                rewrite: (path: string) => path.replace(/^\/api/, '/python'),
              },
            },
          }
        : {}),
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
  };
});
