import { httpClient } from '@shared/api/http-client'

/**
 * Types are intentionally loose (`unknown` on the wire) — the UI dumps the
 * raw response for now. Tighten with real interfaces once we design the UI.
 */
export interface AdminUsersListResponse {
  items: unknown[]
  total: number
}

export const adminUsersService = {
  list(params: { limit: number; offset: number }) {
    return httpClient.get<AdminUsersListResponse>('/admin/users', { params })
  },
  get(id: string) {
    return httpClient.get<unknown>(`/admin/users/${id}`)
  },
  updateJobRole(id: string, jobRole: string) {
    return httpClient.put<unknown>(`/admin/users/${id}/job-role`, { jobRole })
  },
}
