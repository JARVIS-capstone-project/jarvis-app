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
export type LoginRange = 'today' | '7d' | '30d' | '1y' | 'all'

/** One flag: what carried the injection this turn, and which labels matched. */
export interface InjectionFlag {
  /** `user:message` · `attachment:{id}` · `mcp:{conn}/{tool}` · `mcp-tool:{conn}/{tool}`. */
  origin: string
  patterns: string[]
}

/**
 * One immutable turn from the audit trail. Previews only, with one deliberate
 * carve-out: `flagged_input` carries the message verbatim — and only when that
 * message is itself the incident, so it is null on every other row.
 */
export interface AuditRow {
  trace_id: string
  session_id: string
  user_id: string
  severity: string | null
  user_message_preview: string
  response_preview: string
  injection_flags: InjectionFlag[]
  flagged_input: string | null
  requires_escalation: boolean
  created_at: string
}

export const adminAuditService = {
  /**
   * `GET /admin/audit` — raw turn rows, newest first. The three filters compose:
   * `injectionOnly` + `userId` is the ban-evidence view for one account.
   *
   * Returns a bare array with no `total`, so pagination derives "is there a next
   * page?" from whether this one came back full.
   */
  turnsAgent(params: {
    limit: number
    offset: number
    injectionOnly?: boolean
    pattern?: string
    userId?: string
  }) {
    const { limit, offset, injectionOnly, pattern, userId } = params
    return agentHttpClient.get<AuditRow[]>('/admin/audit', {
      params: {
        limit,
        offset,
        // Left off entirely when undefined rather than sent as false — the
        // browse call stays byte-identical to what it sent before filters existed.
        injection_only: injectionOnly,
        pattern,
        user_id: userId,
      },
    })
  },
  logins(params: { limit: number; offset: number; range: LoginRange }) {
    return httpClient.get<unknown>('/admin/audit/logins', { params })
  },
}

/** Windowed rollup of turns where something tried to give the agent orders. */
export type InjectionRange = 'today' | '7d' | '30d'

export interface InjectionSummary {
  range: string
  since: string
  total_turns: number
  /** Chronological. **Gaps mean zero** — the chart has to fill them itself. */
  by_day: { day: string; turns: number }[]
  /** Every flagged user in the window, most turns first — uncapped. */
  top_users: { user_id: string; turns: number; last_seen: string }[]
  by_pattern: { pattern: string; turns: number }[]
}

export const adminInjectionsService = {
  /** Defaults to `7d` server-side, but we always pass it explicitly. */
  summary(range: InjectionRange) {
    return agentHttpClient.get<InjectionSummary>('/admin/audit/injections/summary', {
      params: { range },
    })
  },
}
