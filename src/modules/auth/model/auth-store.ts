import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

/**
 * Persisted auth session. The accessToken lives in localStorage so a page
 * refresh keeps the user signed in until the access token TTL (1h) elapses —
 * at which point the next protected call 401s and the caller must clear() +
 * redirect. Silent refresh via the HttpOnly refresh cookie is a later ticket.
 *
 * The token is a JWT — user identity (email, id, roles) is encoded in its
 * payload. Decode on demand at the call site; nothing is denormalized into
 * this store.
 *
 * Trade-off: localStorage is XSS-readable. If a script injection ever lands
 * in this app, the token is exfiltratable. Accepted for now; revisit when
 * silent refresh ships (which lets us drop the accessToken back into memory).
 */
interface AuthState {
  accessToken: string | null
  setSession: (accessToken: string) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      setSession: (accessToken) => set({ accessToken }),
      clear: () => set({ accessToken: null }),
    }),
    {
      name: 'jarvis.auth',
      storage: createJSONStorage(() => localStorage),
      // Persist only the session slice — never the action functions.
      partialize: (state) => ({ accessToken: state.accessToken }),
    },
  ),
)

// Selector hooks — subscribe only to the slice the caller needs so components
// don't re-render when unrelated fields change.
export const useAccessToken = () => useAuthStore((s) => s.accessToken)
// `Boolean(...)` (not `!== null`) so any falsy token — including an empty
// string a future refresh-error path might set — fails the guard.
export const useIsAuthenticated = () => useAuthStore((s) => Boolean(s.accessToken))
