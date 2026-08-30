import { useCallback, useState } from 'react'
import { authService } from '@modules/auth/api/auth-service'
import { HttpApiError } from '@shared/api/http-client'

/**
 * Discrete states for the reset-password confirm form. The FE renders one
 * of these — no fallthrough logic.
 */
export type ConfirmResetStatus =
  | 'idle'         // pre-submit
  | 'submitting'   // POST /auth/reset/confirm in flight
  | 'success'      // BE returned 200 — password updated
  | 'invalid'      // BE returned 400 reset_token_invalid — expired / used / bad
  | 'error'        // Any other failure — network, 5xx, unexpected shape

interface UseConfirmResetResult {
  status: ConfirmResetStatus
  errorMessage: string | null
  /** Fires POST /auth/reset/confirm. Form-driven — no ref-guard needed
   *  because reentry is naturally blocked by disabling the submit button
   *  while `status === 'submitting'`. */
  confirm: (resetToken: string, newPassword: string) => Promise<void>
  /** Reset to idle — useful for the "Try again" button on the error panel. */
  reset: () => void
}

/**
 * Form-driven counterpart to useVerifyEmail. Same state-per-outcome shape,
 * different trigger: this fires on submit, not on mount. That's why there's
 * no StrictMode ref-guard here — user clicks aren't double-invoked by React.
 */
export function useConfirmReset(): UseConfirmResetResult {
  const [status, setStatus] = useState<ConfirmResetStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const confirm = useCallback(async (resetToken: string, newPassword: string) => {
    setStatus('submitting')
    setErrorMessage(null)
    try {
      await authService.confirmReset({ resetToken, newPassword })
      setStatus('success')
    } catch (err) {
      if (err instanceof HttpApiError && err.code === 'reset_token_invalid') {
        setStatus('invalid')
        setErrorMessage(err.detail)
        return
      }
      setStatus('error')
      setErrorMessage(
        err instanceof Error ? err.message : 'Password reset failed. Please try again.',
      )
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setErrorMessage(null)
  }, [])

  return { status, errorMessage, confirm, reset }
}
