interface AppEnv {
  /** Platform base URL. Default `/api` = same-origin (proxied by Vite dev / Vercel rewrite). */
  platformBaseUrl: string
  /** Current Vite mode: 'development' | 'production' | ... */
  mode: string
  /** True when VITE_MODE=dev — gates dev-only UI (nav items, debug pages). */
  isDev: boolean
}

export const env: AppEnv = {
  platformBaseUrl: import.meta.env.VITE_PLATFORM_BASE_URL ?? '/api',
  mode: import.meta.env.MODE,
  isDev: import.meta.env.VITE_MODE === 'dev',
}
