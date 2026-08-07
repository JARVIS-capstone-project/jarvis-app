import type { ComponentType } from 'react'
import { AlertTriangle, LifeBuoy } from 'lucide-react'
import type { ChatAlertCode } from '@modules/chat/model/chat-session-store'

/**
 * Presentational spec for every typed chat alert. Add a row here when a new
 * `code` gets wired on the BE — the alert component switches on `code` so
 * only this file changes visually.
 *
 * `tone` selects the color palette (warning-* tokens vs danger-* tokens).
 * `title` + `description` render inside the full banner; `short` is the
 * collapsed-pill label. Keep `short` under ~48 chars so the pill stays on
 * one line at the standard composer width.
 */
export interface ChatAlertSpec {
  tone: 'warning' | 'danger'
  Icon: ComponentType<{ className?: string }>
  title: string
  description: string
  short: string
}

export const CHAT_ALERT_CATALOG: Record<ChatAlertCode, ChatAlertSpec> = {
  upstream_rate_limited: {
    tone: 'warning',
    Icon: AlertTriangle,
    title: 'AI service temporarily unavailable',
    description:
      'The daily AI quota has been reached. Please try again in a few hours — the limit resets automatically.',
    short: 'AI quota reached — try again in a few hours',
  },
  // Wire-ready for the human-escalation flag on `turn_end`. Not fired
  // by use-chat-send yet — kept here so the pattern is visible for the
  // follow-up ticket.
  requires_escalation: {
    tone: 'warning',
    Icon: LifeBuoy,
    title: 'Human specialist recommended',
    description:
      'This incident may need a human on-call. Consider escalating through your usual support channel.',
    short: 'Human specialist recommended for this incident',
  },
}
