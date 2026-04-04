/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_REALTIME_MODE?: string;
  readonly VITE_POLLING_MS?: string;
  readonly VITE_SSE_RETRY_MAX?: string;
  readonly VITE_ENABLE_MOCK?: string;
}
