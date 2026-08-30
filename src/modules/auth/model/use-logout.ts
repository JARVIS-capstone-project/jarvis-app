import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import { authService } from '@modules/auth/api/auth-service'
import { useAuthStore } from '@modules/auth/model/auth-store'

interface UseLogoutResult {
  /** Fires the logout pipeline: server call → clear store → redirect to /login. */
  logout: () => Promise<void>
  loading: boolean
}

/**
 * Logout state machine. Calls /auth/logout, clears the client store, and
 * navigates to /login. The server call is fire-and-forget for the redirect:
 * clear + navigate happen regardless of the network outcome, so a stale
 * session on the server can never keep this browser logged in.
 */
export function useLogout(): UseLogoutResult {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const logout = useCallback(async () => {
    setLoading(true)
    try {
      await authService.logout().catch(() => {
        // Swallow: local clear + redirect happens regardless.
      })
    } finally {
      useAuthStore.getState().clear()
      setLoading(false)
      navigate('/login', { replace: true })
    }
  }, [navigate])

  return { logout, loading }
}
