import { httpClient } from '@shared/api/http-client'

/**
 * Mirrors `AdminUserView.java` — the read-only admin projection. It
 * deliberately excludes passwordHash; do not add fields the BE does not send.
 *
 * `status` stays a bare `string` on the wire rather than the `UserStatus`
 * union: the platform stores it as a free-form column (see
 * `AuthAdminModerationCommandsImpl`), so narrowing here would be a lie TS
 * cannot enforce. Callers look it up against `USER_STATUSES` and fall back.
 */
export interface AdminUser {
  id: string
  email: string
  roles: string[]
  status: string
  createdAt: string
}

/** The three values the platform actually writes. Anything else renders neutral. */
export const USER_STATUSES = ['active', 'pending', 'disabled'] as const
export type UserStatus = (typeof USER_STATUSES)[number]

export interface AdminUsersListResponse {
  items: AdminUser[]
  total: number
}

/** Platform's `MessageResponse` record. */
interface MessageResponse {
  message: string
}

export const adminUsersService = {
  list(params: { limit: number; offset: number }) {
    return httpClient.get<AdminUsersListResponse>('/admin/users', { params })
  },
  get(id: string) {
    return httpClient.get<AdminUser>(`/admin/users/${id}`)
  },
  updateJobRole(id: string, jobRole: string) {
    return httpClient.put<unknown>(`/admin/users/${id}/job-role`, { jobRole })
  },
  /**
   * Disables login and revokes every active session immediately. Reversible
   * via `unban`. The BE 409s when the target is pending verification, is the
   * acting admin, or is the last active admin — the first two are pre-empted
   * in the UI, the last one can only be known server-side.
   */
  ban(id: string) {
    return httpClient.put<MessageResponse>(`/admin/users/${id}/ban`, {})
  },
  /** 409s if the user is not currently banned. */
  unban(id: string) {
    return httpClient.put<MessageResponse>(`/admin/users/${id}/unban`, {})
  },
}
