import { httpClient } from '@shared/api/http-client'

/**
 * Wire-shape of the login endpoint. The BE isn't wired yet, but committing
 * these types now keeps the UI and hook honest — swap the stub body for the
 * real call and the rest of the module compiles unchanged.
 */
export interface LoginCredentials {
  email: string
  password: string
  remember?: boolean
}

export interface LoginSession {
  accessToken: string
  refreshToken?: string
  user: {
    id: string
    email: string
    displayName?: string
  }
}

/**
 * Simulated latency + validation stub. Delete the `simulate*` calls and the
 * `if (!/@/.test(...))` guard when the real `/auth/login` endpoint ships.
 *
 * The real call is left in place, commented, so wiring is a one-line switch.
 */
export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginSession> {
    // return httpClient.post<LoginSession>('/auth/login', credentials)

    await simulateLatency(900)
    if (!/@/.test(credentials.email)) throw new Error('Invalid email address.')
    if (credentials.password.length < 6) throw new Error('Password must be at least 6 characters.')

    return {
      accessToken: `stub.${btoa(credentials.email)}.${Date.now()}`,
      user: { id: 'stub-user', email: credentials.email, displayName: 'Operator' },
    }
  },

  async logout(): Promise<void> {
    // return httpClient.post<void>('/auth/logout')
    await simulateLatency(200)
  },

  async currentSession(): Promise<LoginSession | null> {
    // return httpClient.get<LoginSession | null>('/auth/session')
    return null
  },
}

// Keeps the import from being dead-code-eliminated by the compiler while
// the real endpoints stay commented. Once wired, this line goes away.
void httpClient

function simulateLatency(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
