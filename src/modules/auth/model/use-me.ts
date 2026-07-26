import { useEffect, useState } from 'react'
import { httpClient } from '@shared/api/http-client'
import { useAuthStore } from '@modules/auth/model/auth-store'

/**
 * Shape of `GET /api/auth/me` (mirrors `MeResponse` on the BE). Snake case
 * would be misleading here — the BE returns camelCase from the Java record.
 */
export interface Me {
  id: string
  email: string
  roles: string[]
  createdAt: string
  updatedAt: string
}

interface UseMeResult {
  data: Me | null
  loading: boolean
}

/**
 * Fetches the authenticated caller's profile once on mount. Purpose is
 * twofold:
 *   1. Provide a fresh email/roles snapshot for the UI (Sidebar footer).
 *   2. Detect a "ghost session" — token is still valid on the FE but the
 *      user was deleted server-side. On 401 (token dead, or account gone
 *      and the JWT filter can't resolve it), we clear the auth store and
 *      hard-redirect to /login.
 *
 * We use `window.location.href` rather than a router hook so this can be
 * dropped into any tree (including one mounted outside the router context
 * during a race) without lifting the redirect out.
 */
export function useMe(): UseMeResult {
  const [data, setData] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const me = await httpClient.get<Me>('/auth/me')
        if (!cancelled) setData(me)
      } catch (err) {
        if (cancelled) return
        // httpClient throws `Error("Request failed: 401 …")`. A 401 here is
        // the definitive "your session is invalid" signal — nothing else on
        // /auth/me should reasonably 401. Bounce.
        const msg = err instanceof Error ? err.message : ''
        if (msg.includes('401')) {
          useAuthStore.getState().clear()
          window.location.href = '/login'
          return
        }
        // Any other error (500, network) — keep the sidebar mounted, don't
        // sign the user out on a transient failure. The email just doesn't
        // render this cycle.
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return { data, loading }
}
