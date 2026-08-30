interface AppEnv {
  /** Base path for API calls. Proxied in dev (see vite.config.ts). */
  apiBaseUrl: string
  /** Current Vite mode: 'development' | 'production' | ... */
  mode: string
  /** True when VITE_MODE=dev — gates dev-only UI (nav items, debug pages). */
  isDev: boolean
}

export const env: AppEnv = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
  mode: import.meta.env.MODE,
  isDev: import.meta.env.VITE_MODE === 'dev',
}
