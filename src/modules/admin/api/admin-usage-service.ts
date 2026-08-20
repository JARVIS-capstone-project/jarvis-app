import { agentHttpClient } from '@shared/api/agent-http-client'

/**
 * Deployment-wide LLM token usage (`modules/usage/api.py`, admin-only).
 *
 * Summed across every user, not per-user: there is one Gemini key for the
 * whole deployment, so this single total is the number that matters.
 *
 * **Report-only.** The service docstring says it twice — there is no cap,
 * ceiling, or throttle anywhere in this path. The UI must not imply a quota
 * it would be inventing.
 */
export type UsageRange = 'today' | '7d' | '30d'

export interface UsageTotals {
  calls: number
  prompt_tokens: number
  output_tokens: number
  thinking_tokens: number
  tool_tokens: number
  /**
   * An informational **subset of `prompt_tokens`**, not an addend of
   * `total_tokens`. Stacking it beside the others double-counts.
   */
  cached_tokens: number
  total_tokens: number
}

export interface UsageOverview {
  range: string
  since: string
  totals: UsageTotals
}

export const adminUsageService = {
  /** `range` is required here — unlike the audit summaries, it has no default. */
  overview(range: UsageRange) {
    return agentHttpClient.get<UsageOverview>('/admin/usage', { params: { range } })
  },
}
