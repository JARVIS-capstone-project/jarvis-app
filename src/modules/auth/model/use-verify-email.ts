import { useEffect, useRef, useState } from 'react'
import { authService } from '@modules/auth/api/auth-service'
import { HttpApiError } from '@shared/api/http-client'

/**
 * Discrete states for the /verify-email landing page. The FE renders one of
 * four visuals based on this — no fallthrough logic.
 */
export type VerifyStatus =
  | 'verifying'    // token present, POST /auth/verify in flight
  | 'success'      // BE returned 204 — account is now active
  | 'invalid'      // BE returned 400 verify_token_invalid — expired / already used / bad
  | 'no-token'     // URL had no ?token= — user typed the URL by hand
  | 'error'        // Any other failure — network, 5xx, unexpected shape

interface UseVerifyEmailResult {
  status: VerifyStatus
  errorMessage: string | null
}

/**
 * Kicks off the /verify call the moment the page mounts, once. Deliberately
 * ignores the `token` value changing after mount — the URL query is captured
 * on first render and stale changes don't retry (a fresh navigation
 * remounts the page anyway).
 *
 * StrictMode double-invoke defense: `startedRef` gates the fetch so the
 * second effect pass doesn't fire a second /verify request (which would 400
 * as verify_token_invalid because the first pass already consumed the token).
 *
 * We DON'T also gate `setStatus` behind a per-effect `cancelled` flag: in
 * StrictMode the first effect's cleanup flips its `cancelled` to true and the
 * second effect returns early (startedRef blocks it), so the in-flight fetch
 * would resolve with `cancelled === true` and silently drop the state update
 * — leaving the page stuck on "verifying" even after a 204. React 18+
 * tolerates the eventual setState-on-unmounted-component in this shape.
 */
export function useVerifyEmail(token: string | null): UseVerifyEmailResult {
  const [status, setStatus] = useState<VerifyStatus>(token ? 'verifying' : 'no-token')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!token) return
    if (startedRef.current) return
    startedRef.current = true

    ;(async () => {
      try {
        await authService.verifyEmail(token)
        setStatus('success')
      } catch (err) {
        if (err instanceof HttpApiError && err.code === 'verify_token_invalid') {
          setStatus('invalid')
          setErrorMessage(err.detail)
          return
        }
        setStatus('error')
        setErrorMessage(err instanceof Error ? err.message : 'Verification failed. Please try again.')
      }
    })()
  }, [token])

  return { status, errorMessage }
}
