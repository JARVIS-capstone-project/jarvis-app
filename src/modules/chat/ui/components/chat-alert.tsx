import { useParams } from 'react-router'
import { X } from 'lucide-react'
import { useChatSessionStore } from '@modules/chat/model/chat-session-store'
import {
  CHAT_ALERT_CATALOG,
  type ChatAlertSpec,
} from '@modules/chat/ui/components/chat-alert-catalog'
import { cn } from '@shared/lib/cn'

/**
 * Typed alert surface docked above the composer. Two visual states:
 *   - Full   — icon + title + description + X
 *   - Collapsed — icon + short label; persists across reloads
 *
 * Dismiss semantics are per-code: `requires_escalation` fully clears (each
 * turn re-fires it if still applicable, so a lingering pill would be noise);
 * rate-limit collapses to the short pill so the user keeps ambient awareness
 * of the throttle until they get a clean turn back.
 *
 * Route-gated: only renders inside an actual chat session (`/chat/:sessionId`).
 * On `/new` we deliberately hide the alert so a fresh conversation reads
 * clean — the alert stays in the store (persisted) and re-appears the moment
 * the user is back in a session view.
 *
 * Content comes from the catalog keyed by the alert's `code`, so per-event
 * icon + wording changes live in one file (chat-alert-catalog.ts).
 */
export function ChatAlert() {
  const { sessionId } = useParams<{ sessionId?: string }>()
  const alert = useChatSessionStore((s) => s.alert)
  const dismissAlert = useChatSessionStore((s) => s.dismissAlert)
  const clearAlert = useChatSessionStore((s) => s.clearAlert)

  if (!sessionId) return null
  if (!alert) return null
  const spec = CHAT_ALERT_CATALOG[alert.code]
  if (!spec) return null

  const onDismiss =
    alert.code === 'requires_escalation' ? clearAlert : dismissAlert

  return alert.collapsed ? (
    <CollapsedAlert spec={spec} />
  ) : (
    <FullAlert spec={spec} onDismiss={onDismiss} />
  )
}

// Tone → concrete Tailwind tokens. The soft bg / solid border pairing
// matches the project's status-pill convention (see admin audit cards).
const TONE_STYLES = {
  warning: {
    container: 'border-warning bg-warning-soft',
    icon: 'text-warning',
    title: 'text-heading',
    body: 'text-body',
  },
  danger: {
    container: 'border-danger bg-danger-soft',
    icon: 'text-danger',
    title: 'text-heading',
    body: 'text-body',
  },
} as const

function FullAlert({
  spec,
  onDismiss,
}: {
  spec: ChatAlertSpec
  onDismiss: () => void
}) {
  const styles = TONE_STYLES[spec.tone]
  return (
    <div
      role="status"
      className={cn(
        'relative mb-2 flex items-start gap-3 rounded-xl border px-4 py-3',
        styles.container,
      )}
    >
      <spec.Icon className={cn('mt-0.5 size-5 shrink-0', styles.icon)} />
      <div className="min-w-0 flex-1 pr-6">
        <p className={cn('text-sm font-semibold', styles.title)}>
          {spec.title}
        </p>
        <p className={cn('mt-0.5 text-sm', styles.body)}>{spec.description}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss alert"
        className={cn(
          'absolute right-2 top-2 flex size-7 items-center justify-center rounded-md transition-colors',
          styles.body,
          'hover:bg-hover hover:text-heading',
        )}
      >
        <X className="size-4" />
      </button>
    </div>
  )
}

function CollapsedAlert({ spec }: { spec: ChatAlertSpec }) {
  const styles = TONE_STYLES[spec.tone]
  return (
    <div
      role="status"
      className={cn(
        'mb-2 flex w-fit items-center gap-2 rounded-full border px-3 py-1.5',
        styles.container,
      )}
    >
      <spec.Icon className={cn('size-4 shrink-0', styles.icon)} />
      <span className={cn('truncate text-xs font-medium', styles.title)}>
        {spec.short}
      </span>
    </div>
  )
}
