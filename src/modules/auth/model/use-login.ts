import { useCallback, useState } from 'react'
import { authService } from '@modules/auth/api/auth-service'
import type { LoginCredentials, LoginSession } from '@modules/auth/api/auth-service'
import { useAuthStore } from '@modules/auth/model/auth-store'
import { HttpApiError } from '@shared/api/http-client'

interface UseLoginState {
  isSubmitting: boolean
  error: string | null
  /** BE `error` code when the failure was a structured ApiError. Lets the form
   *  swap the generic error banner for a specialised UI on codes like
   *  `email_not_verified`. Null on network errors or when the response body
   *  didn't carry a code. */
  errorCode: string | null
  session: LoginSession | null
}

interface UseLoginResult extends UseLoginState {
  /** Attempts a login; resolves to the session on success, or null on failure. */
  submit: (credentials: LoginCredentials) => Promise<LoginSession | null>
  /** Clears the last error message — call when the user edits a field. */
  clearError: () => void
}

/**
 * Login state machine. Owns submission + error surface only — the form owns
 * field state so uncontrolled inputs stay uncontrolled. Exposes the BE's
 * structured `error` code alongside the message so the FE can render specific
 * UIs for known failures (e.g. `email_not_verified` → resend affordance).
 */
export function useLogin(): UseLoginResult {
  const [state, setState] = useState<UseLoginState>({
    isSubmitting: false,
    error: null,
    errorCode: null,
    session: null,
  })

  const submit = useCallback(async (credentials: LoginCredentials) => {
    setState((prev) => ({ ...prev, isSubmitting: true, error: null, errorCode: null }))
    try {
      const session = await authService.login(credentials)
      // Explicit: only accessToken goes into memory. refreshToken lives in an
      // HttpOnly cookie set by the same BE response — never touched here.
      useAuthStore.getState().setSession(session.accessToken)
      setState({ isSubmitting: false, error: null, errorCode: null, session })
      return session
    } catch (err) {
      let message = 'Unable to sign in. Please try again.'
      let errorCode: string | null = null
      if (err instanceof HttpApiError) {
        errorCode = err.code
        message = err.detail ?? err.message
      } else if (err instanceof Error) {
        message = err.message
      }
      setState((prev) => ({ ...prev, isSubmitting: false, error: message, errorCode }))
      return null
    }
  }, [])

  const clearError = useCallback(() => {
    setState((prev) =>
      prev.error || prev.errorCode ? { ...prev, error: null, errorCode: null } : prev,
    )
  }, [])

  return { ...state, submit, clearError }
}
