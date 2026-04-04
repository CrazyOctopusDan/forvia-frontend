function getEnvString(key: keyof ImportMetaEnv, fallback: string): string {
  const value = import.meta.env[key];
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function getEnvNumber(key: keyof ImportMetaEnv, fallback: number): number {
  const value = Number(import.meta.env[key]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function getEnvBoolean(key: keyof ImportMetaEnv, fallback: boolean): boolean {
  const value = import.meta.env[key];
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return fallback;
}

export const env = {
  apiBaseUrl: getEnvString('VITE_API_BASE_URL', 'http://localhost:4000'),
  realtimeMode: getEnvString('VITE_REALTIME_MODE', 'sse'),
  pollingMs: getEnvNumber('VITE_POLLING_MS', 60000),
  sseRetryMax: getEnvNumber('VITE_SSE_RETRY_MAX', 5),
  enableMock: getEnvBoolean('VITE_ENABLE_MOCK', false)
} as const;
