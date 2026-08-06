import { httpClient } from '@shared/api/http-client'
import { agentHttpClient } from '@shared/api/agent-http-client'

/**
 * Turn audit is agent-scoped only — platform used to mirror it via
 * `/api/admin/audit` (mock/PLAT-7) but that endpoint was removed. The FE now
 * calls agent directly for turns.
 *
 * Login history stays on platform — logins are auth events that happen on
 * platform, not agent, so there's no agent equivalent to migrate to.
 */
export const adminAuditService = {
  turnsAgent(params: { limit: number; offset: number }) {
    return agentHttpClient.get<unknown>('/admin/audit', { params })
  },
  logins(params: { limit: number; offset: number }) {
    return httpClient.get<unknown>('/admin/audit/logins', { params })
  },
}
