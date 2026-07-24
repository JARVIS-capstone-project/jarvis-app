import { useCallback, useState } from 'react'
import { authService } from '@modules/auth/api/auth-service'

export type RequestResetStatus = 'idle' | 'sending' | 'sent' | 'error'

interface UseRequestResetResult {
  status: RequestResetStatus
  errorMessage: string | null
  /** Fires POST /auth/reset for the given email. Anti-enumeration: a
   *  resolved promise does NOT confirm an email was actually dispatched.
   *  Returns true on 2xx, false on error — the caller navigates on true. */
  request: (email: string) => Promise<boolean>
  /** Reset to idle — useful when the user edits the email input. */
  reset: () => void
}

/**
 * Small state machine for the forgot-password submit. Same shape as
 * useResendVerification because the BE contract is identical (200 for both
 * existing and missing accounts, per-email throttle).
 *
 * The 'sent' state is set for completeness but callers typically navigate
 * away on success (to /forgot-password/sent), so the UI rarely renders it.
 */
export function useRequestReset(): UseRequestResetResult {
  const [status, setStatus] = useState<RequestResetStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const request = useCallback(async (email: string) => {
    setStatus('sending')
    setErrorMessage(null)
    try {
      await authService.requestReset(email)
      setStatus('sent')
      return true
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Failed to send reset link.')
      return false
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setErrorMessage(null)
  }, [])

  return { status, errorMessage, request, reset }
}
