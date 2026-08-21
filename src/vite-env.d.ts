/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_API_TARGET?: string
  /** Absolute agent-system origin. Unset = same-origin `/agent` via a proxy. */
  readonly VITE_AGENT_BASE_URL?: string
  /** `dev` gates dev-only UI. Anything else (or unset) hides it. */
  readonly VITE_MODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
