import { useCallback, useState } from 'react'
import { authService } from '@modules/auth/api/auth-service'

export type ResendStatus = 'idle' | 'sending' | 'sent' | 'error'

interface UseResendVerificationResult {
  status: ResendStatus
  errorMessage: string | null
  /** Fires POST /auth/verify/resend for the given email. Anti-enumeration: a
   *  resolved promise does NOT confirm an email was actually dispatched. */
  resend: (email: string) => Promise<void>
  /** Reset to idle — useful when the user edits the email or navigates away. */
  reset: () => void
}

/**
 * Small state machine for the "Resend verification email" button. UX pattern:
 *   idle    → click → sending
 *   sending → BE 200 → sent (button label swaps to 'Sent!', disabled to
 *                    discourage rapid re-clicks; ties into the BE's 2-min
 *                    per-email throttle even if the user still clicks again)
 *   sending → BE error → error (renders inline copy, button re-enabled)
 *
 * No cooldown timer on the FE — the BE enforces the 2-min throttle and would
 * silently no-op a second click anyway. Keeping the FE state simple avoids
 * duplicating that logic.
 */
export function useResendVerification(): UseResendVerificationResult {
  const [status, setStatus] = useState<ResendStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const resend = useCallback(async (email: string) => {
    setStatus('sending')
    setErrorMessage(null)
    try {
      await authService.resendVerification(email)
      setStatus('sent')
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Unable to resend. Please try again.')
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setErrorMessage(null)
  }, [])

  return { status, errorMessage, resend, reset }
}
