/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Platform base URL. Relative `/api` = same-origin (Vite dev proxy or Vercel rewrite forwards it). Absolute = direct cross-origin call. */
  readonly VITE_PLATFORM_BASE_URL?: string
  /** Agent-system base URL. Unset = same-origin `/agent` via proxy. Absolute = direct cross-origin call (bypasses Vercel for SSE). */
  readonly VITE_AGENT_BASE_URL?: string
  /** `dev` gates dev-only UI. Anything else (or unset) hides it. */
  readonly VITE_MODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
