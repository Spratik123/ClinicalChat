/** Typed, validated access to build-time environment configuration. */

interface AppEnv {
  apiBaseUrl: string;
  useMocks: boolean;
  envLabel: string;
  isDev: boolean;
}

function readBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback;
  return value === 'true' || value === '1';
}

export const env: AppEnv = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
  useMocks: readBool(import.meta.env.VITE_USE_MOCKS, import.meta.env.DEV),
  envLabel: import.meta.env.VITE_ENV_LABEL ?? 'local',
  isDev: import.meta.env.DEV,
};
