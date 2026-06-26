interface AppEnv {
  /** Base path for API calls. Proxied in dev (see vite.config.ts). */
  apiBaseUrl: string
  /** Current Vite mode: 'development' | 'production' | ... */
  mode: string
}

export const env: AppEnv = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
  mode: import.meta.env.MODE,
}
