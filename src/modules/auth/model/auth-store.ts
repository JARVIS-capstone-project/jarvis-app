import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { UserSummary } from '@modules/auth/api/auth-service'

/**
 * Persisted auth session. accessToken + user live in localStorage so a page
 * refresh keeps the user signed in until the access token TTL (1h) elapses —
 * at which point the next protected call 401s and the caller must clear() +
 * redirect. Silent refresh via the HttpOnly refresh cookie is a later ticket.
 *
 * Trade-off: localStorage is XSS-readable. If a script injection ever lands
 * in this app, the token is exfiltratable. Accepted for now; revisit when
 * silent refresh ships (which lets us drop the accessToken back into memory).
 */
interface AuthState {
  accessToken: string | null
  user: UserSummary | null
  setSession: (accessToken: string, user: UserSummary) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setSession: (accessToken, user) => set({ accessToken, user }),
      clear: () => set({ accessToken: null, user: null }),
    }),
    {
      name: 'jarvis.auth',
      storage: createJSONStorage(() => localStorage),
      // Persist only the session slice — never the action functions.
      partialize: (state) => ({ accessToken: state.accessToken, user: state.user }),
    },
  ),
)

// Selector hooks — subscribe only to the slice the caller needs so components
// don't re-render when unrelated fields change.
export const useAccessToken = () => useAuthStore((s) => s.accessToken)
export const useUser = () => useAuthStore((s) => s.user)
// `Boolean(...)` (not `!== null`) so any falsy token — including an empty
// string a future refresh-error path might set — fails the guard.
export const useIsAuthenticated = () => useAuthStore((s) => Boolean(s.accessToken))
