import { agentHttpClient } from '@shared/api/agent-http-client'

/**
 * Two-source system reads:
 *   - agent-system   `/health`, `/metrics`   (metrics is admin-only)
 *   - platform-system `/health`              (public, root path — reached
 *                                             via a dedicated Vite proxy)
 *
 * Platform's `/health` is unauthenticated + tiny (`{status, timestamp}`).
 * We fetch it directly instead of going through httpClient because
 * httpClient prefixes `platformBaseUrl` (`/api`) and platform's health sits at
 * ROOT — no auth header needed either.
 */
export const adminSystemService = {
  health() {
    return agentHttpClient.get<unknown>('/health')
  },
  metrics() {
    return agentHttpClient.get<unknown>('/metrics')
  },
  async platformHealth(): Promise<unknown> {
    const res = await fetch('/health', { credentials: 'include' })
    if (!res.ok) {
      throw new Error(`Request failed: ${res.status} ${res.statusText}`)
    }
    return res.json()
  },
}
