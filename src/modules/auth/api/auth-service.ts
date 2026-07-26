import { httpClient } from '@shared/api/http-client'

export interface LoginCredentials {
  email: string
  password: string
  remember?: boolean
}

// Matches the BE `RegisterRequest` DTO exactly — email + password only.
// Confirm-password and terms-accepted are FE-only concerns and never leave
// the browser.
export interface RegisterCredentials {
  email: string
  password: string
}

// Login response shape. The accessToken is a JWT and carries user identity
// (email, id, roles) in its payload — decode on demand at the call site. BE
// also returns refreshToken in the body, but the FE ignores it: the browser
// stores it via the HttpOnly cookie set on the same response.
export interface LoginSession {
  accessToken: string
}

/**
 * Register response — NO session tokens. New accounts land in {status: "pending"}
 * and cannot log in until the emailed verification link is clicked. FE routes
 * to /verify-email/sent on success, echoing the email back so the user knows
 * where the link landed.
 */
export interface RegisterResponse {
  status: 'pending' | 'active'
  email: string
}

/**
 * Auth endpoints. All calls go through httpClient, which attaches the Bearer
 * token from the auth store (when present) and sets credentials: 'include' so
 * the HttpOnly refresh cookie can travel back on /auth/refresh once silent
 * refresh is wired.
 */
export const authService = {
  login(credentials: LoginCredentials): Promise<LoginSession> {
    return httpClient.post<LoginSession>('/auth/login', credentials)
  },

  // BE now returns 201 { status, email } with NO session — user must click the
  // verify link before they can log in. Callers should navigate to the "check
  // your inbox" page on success and NEVER attempt to store a session from
  // this response.
  register(credentials: RegisterCredentials): Promise<RegisterResponse> {
    return httpClient.post<RegisterResponse>('/auth/register', credentials)
  },

  logout(): Promise<void> {
    return httpClient.post<void>('/auth/logout')
  },

  /** Consumes the raw token from a verification email. 204 on success. */
  verifyEmail(token: string): Promise<void> {
    return httpClient.post<void>('/auth/verify', { token })
  },

  /**
   * Requests a fresh verification email. BE responds 200 whether or not the
   * account exists (anti-enumeration), so a resolved promise is NEVER a
   * confirmation that an email was actually dispatched.
   */
  resendVerification(email: string): Promise<void> {
    return httpClient.post<void>('/auth/verify/resend', { email })
  },

  /**
   * Requests a password-reset email. Like resendVerification, BE responds 200
   * whether or not the account exists (anti-enumeration) — resolved does NOT
   * confirm dispatch. The BE also throttles per-email, so rapid re-submits
   * silently no-op.
   */
  requestReset(email: string): Promise<void> {
    return httpClient.post<void>('/auth/reset', { email })
  },

  /**
   * Consumes the raw token from a reset-password email + the new plaintext
   * password. BE hashes and stores. 200 on success; 400 with
   * `error: "reset_token_invalid"` on expired / already-used / bad token.
   */
  confirmReset(payload: { resetToken: string; newPassword: string }): Promise<void> {
    return httpClient.post<void>('/auth/reset/confirm', payload)
  },
}
