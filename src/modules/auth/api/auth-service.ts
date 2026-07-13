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

// Mirrors the BE `UserSummary` DTO — kept in one place so the store, the
// login response, and any future /me consumer share a single shape.
export interface UserSummary {
  id: string
  email: string
  roles: string[]
}

export interface LoginSession {
  accessToken: string
  // BE also returns refreshToken in the body — ignored on the FE; the browser
  // handles it via an HttpOnly cookie set on the same login response.
  refreshToken?: string
  user: UserSummary
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
  // login response.
  register(credentials: RegisterCredentials): Promise<LoginSession> {
    return httpClient.post<LoginSession>('/auth/register', credentials)
  },

  logout(): Promise<void> {
    return httpClient.post<void>('/auth/logout')
  },

  currentSession(): Promise<UserSummary> {
    return httpClient.get<UserSummary>('/auth/me')
  },
}
