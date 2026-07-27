import { httpClient } from '@shared/api/http-client'
import { agentHttpClient } from '@shared/api/agent-http-client'

/**
 * Platform (`/api/*`) returns { items, total } envelopes; agent (`/agent/*`)
 * returns a bare array. Types are `unknown` on the wire — the pages dump the
 * raw response for now.
 */
export const adminAuditService = {
  turnsPlatform(params: { limit: number; offset: number }) {
    return httpClient.get<unknown>('/admin/audit', { params })
  },
  turnsAgent(params: { limit: number; offset: number }) {
    return agentHttpClient.get<unknown>('/admin/audit', { params })
  },
  logins(params: { limit: number; offset: number }) {
    return httpClient.get<unknown>('/admin/audit/logins', { params })
  },
}
