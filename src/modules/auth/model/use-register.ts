import { useCallback, useState } from 'react'
import { authService } from '@modules/auth/api/auth-service'
import type { RegisterCredentials, RegisterResponse } from '@modules/auth/api/auth-service'

interface UseRegisterState {
  isSubmitting: boolean
  error: string | null
  result: RegisterResponse | null
}

interface UseRegisterResult extends UseRegisterState {
  /** Attempts registration; resolves to the response on success, or null on failure. */
  submit: (credentials: RegisterCredentials) => Promise<RegisterResponse | null>
  /** Clears the last error — call when the user edits a field. */
  clearError: () => void
}

/**
 * Register state machine. The BE now returns { status: "pending", email } with
 * NO session tokens — the user must click the verify link before logging in —
 * so this hook NO LONGER touches the auth store. On success the caller should
 * navigate to /verify-email/sent (see RegisterForm).
 */
export function useRegister(): UseRegisterResult {
  const [state, setState] = useState<UseRegisterState>({
    isSubmitting: false,
    error: null,
    result: null,
  })

  const submit = useCallback(async (credentials: RegisterCredentials) => {
    setState((prev) => ({ ...prev, isSubmitting: true, error: null }))
    try {
      const result = await authService.register(credentials)
      setState({ isSubmitting: false, error: null, result })
      return result
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
