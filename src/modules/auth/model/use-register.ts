import { useCallback, useState } from 'react'
import { authService } from '@modules/auth/api/auth-service'
import type { LoginSession, RegisterCredentials } from '@modules/auth/api/auth-service'
import { useAuthStore } from '@modules/auth/model/auth-store'

interface UseRegisterState {
  isSubmitting: boolean
  error: string | null
  session: LoginSession | null
}

interface UseRegisterResult extends UseRegisterState {
  /** Attempts registration; resolves to the session on success, or null on failure. */
  submit: (credentials: RegisterCredentials) => Promise<LoginSession | null>
  /** Clears the last error — call when the user edits a field. */
  clearError: () => void
}

/**
 * Register state machine. Mirrors useLogin — owns submission + error surface
 * only, form component owns field state so uncontrolled inputs stay
 * uncontrolled. On success, pushes the session into the auth store BEFORE
 * resolving so guards see it and downstream navigation lands on a protected
 * route without a flash of /login.
 */
export function useRegister(): UseRegisterResult {
  const [state, setState] = useState<UseRegisterState>({
    isSubmitting: false,
    error: null,
    session: null,
  })

  const submit = useCallback(async (credentials: RegisterCredentials) => {
    setState((prev) => ({ ...prev, isSubmitting: true, error: null }))
    try {
      const session = await authService.register(credentials)
      // Only accessToken goes into memory. refreshToken lives in an HttpOnly
      // cookie set by the same response — never touched here.
      useAuthStore.getState().setSession(session.accessToken)
      setState({ isSubmitting: false, error: null, session })
      return session
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to register. Please try again.'
      setState((prev) => ({ ...prev, isSubmitting: false, error: message }))
      return null
    }
  }, [])

  const clearError = useCallback(() => {
    setState((prev) => (prev.error ? { ...prev, error: null } : prev))
  }, [])

  return { ...state, submit, clearError }
}
