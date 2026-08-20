import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { decodeAccessToken } from '@shared/lib/decode-jwt'

/**
 * Persisted auth session. The accessToken lives in localStorage so a page
 * refresh keeps the user signed in until the access token TTL (1h) elapses —
 * at which point the next protected call 401s and the caller must clear() +
 * redirect. Silent refresh via the HttpOnly refresh cookie is a later ticket.
 *
 * `roles` is derived from the token payload at `setSession` time and persisted
 * alongside so a page refresh doesn't lose the admin-nav visibility. The BE
 * remains the authority — every admin API call is server-side gated.
 *
 * Trade-off: localStorage is XSS-readable. If a script injection ever lands
 * in this app, the token is exfiltratable. Accepted for now; revisit when
 * silent refresh ships (which lets us drop the accessToken back into memory).
 */
interface AuthState {
  accessToken: string | null
  roles: string[]
  setSession: (accessToken: string) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      roles: [],
      setSession: (accessToken) => {
        const payload = decodeAccessToken(accessToken)
        set({ accessToken, roles: payload?.roles ?? [] })
      },
      clear: () => set({ accessToken: null, roles: [] }),
    }),
    {
      name: 'jarvis.auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        roles: state.roles,
      }),
    },
  ),
)

// Selector hooks — subscribe only to the slice the caller needs so components
// don't re-render when unrelated fields change.
export const useAccessToken = () => useAuthStore((s) => s.accessToken)
// `Boolean(...)` (not `!== null`) so any falsy token — including an empty
// string a future refresh-error path might set — fails the guard.
export const useIsAuthenticated = () => useAuthStore((s) => Boolean(s.accessToken))
// Uppercase 'ADMIN' matches the platform-issued JWT `roles` claim exactly
// (see UserRoleConfig.java). Do not lowercase-compare.
export const useIsAdmin = () => useAuthStore((s) => s.roles.includes('ADMIN'))
/**
 * The signed-in admin's own user id, decoded from the token's `sub` claim.
 *
 * Derived on read rather than persisted alongside `roles`: adding a field to
 * the persisted shape would leave every already-signed-in session with it
 * undefined until the next login, and the one screen that needs it (the admin
 * roster, to refuse a self-ban) would silently mis-gate for exactly the people
 * most likely to be logged in already. Decoding is base64 + JSON.parse, and
 * this store changes about once per session.
 */
export const useCurrentUserId = () =>
  useAuthStore((s) => (s.accessToken ? (decodeAccessToken(s.accessToken)?.sub ?? null) : null))
