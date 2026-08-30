import { env } from '@shared/config/env'
import { useAuthStore } from '@modules/auth/model/auth-store'

/**
 * Module-level dedupe: if a refresh is already in flight, every caller
 * awaits the SAME promise. N concurrent 401s → 1 network call.
 * `null` means idle; a Promise means in flight.
 */
let inFlight: Promise<string | null> | null = null

/**
 * Fires `POST /api/auth/refresh` and returns the new access token, or
 * `null` if refresh failed (in which case the auth store is cleared and
 * the page is hard-redirected to /login).
 *
 * The HttpOnly refresh cookie is sent automatically via
 * `credentials: 'include'`; the server rotates it and returns a new
 * `Set-Cookie` header on success. Only the new access token comes back
 * in the response body.
 *
 * Callers (http-client, agent-http-client) call this on any 401 from a
 * protected endpoint. On success they retry the original request once;
 * on failure the redirect has already fired, so they just propagate the
 * error.
 */
export function refreshAccessToken(): Promise<string | null> {
  if (inFlight) return inFlight

  inFlight = (async () => {
    try {
      const res = await fetch(`${env.apiBaseUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) {
        throw new Error(`Refresh failed: ${res.status} ${res.statusText}`)
      }
      const body = (await res.json()) as { accessToken?: string }
      if (!body.accessToken) {
        throw new Error('Refresh response missing accessToken')
      }
      useAuthStore.getState().setSession(body.accessToken)
      return body.accessToken
    } catch (err) {
      // Refresh cookie expired / revoked / theft detected → session over.
      // Hard redirect (not react-router) so any stale in-tree state is
      // dropped and every store re-initialises fresh at /login.
      useAuthStore.getState().clear()
      console.warn(
        '[refresh]',
        err instanceof Error ? err.message : String(err),
      )
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
      return null
    } finally {
      inFlight = null
    }
  })()

  return inFlight
}
