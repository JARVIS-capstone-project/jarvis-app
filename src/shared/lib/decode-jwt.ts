import { jwtDecode } from 'jwt-decode'

/**
 * Platform's access-token payload (see JwtService.java). The FE only reads
 * `roles` (for admin nav) and `sub`/`email` (for display) — signature
 * verification is the BE's job. Decode is best-effort; a malformed token
 * yields `null` and the caller treats the user as unauthenticated / no-role.
 */
export interface AccessTokenPayload {
  sub: string
  email?: string
  roles: string[]
  jti?: string
  typ?: string
  iss?: string
  iat?: number
  exp?: number
}

export function decodeAccessToken(token: string): AccessTokenPayload | null {
  try {
    const payload = jwtDecode<AccessTokenPayload>(token)
    if (!payload || typeof payload !== 'object') return null
    if (!Array.isArray(payload.roles)) return null
    return payload
  } catch {
    return null
  }
}
