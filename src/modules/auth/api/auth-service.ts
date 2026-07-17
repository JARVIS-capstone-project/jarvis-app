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

// Login/register response shape. The accessToken is a JWT and carries user
// identity (email, id, roles) in its payload — decode on demand at the call
// site. BE also returns refreshToken in the body, but the FE ignores it: the
// browser stores it via the HttpOnly cookie set on the same response.
export interface LoginSession {
  accessToken: string
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

  // BE returns AuthResponse (accessToken + refreshToken + user) with 201, so
  // a successful register auto-logs the caller in — the FE treats it as a
  // login response and reads only accessToken.
  register(credentials: RegisterCredentials): Promise<LoginSession> {
    return httpClient.post<LoginSession>('/auth/register', credentials)
  },

  logout(): Promise<void> {
    return httpClient.post<void>('/auth/logout')
  },
}
