import { RotateCcw, X } from 'lucide-react'
import { useRollbackHint, useRollbackHintsStore } from '@modules/chat/model/rollback-hints-store'

interface RollbackNoticeProps {
  sessionId: string
}

/**
 * Standalone notice shown above an EMPTY chat session — the case where
 * the first turn was rolled back BE-side and, on refresh, the session
 * comes back with zero turns. Without this the user sees a blank pane
 * with no explanation of why their message vanished.
 *
 * Placed in `ChatSection` and gated on `messages.length === 0 &&
 * !hydrating`, so a session that hydrates with real content never
 * surfaces it (hydration also self-clears the hint — see
 * `use-hydrate-session`, this is belt-and-braces).
 *
 * Rendering nothing when no hint exists keeps this component safe to
 * mount unconditionally.
 */
export function RollbackNotice({ sessionId }: RollbackNoticeProps) {
  const hint = useRollbackHint(sessionId)
  const clear = useRollbackHintsStore((s) => s.clear)
  if (!hint) return null

  return (
    <div
      role="status"
      className="mx-auto mt-8 flex max-w-2xl items-start gap-3 rounded-2xl border border-warning/40 bg-warning/10 px-4 py-3"
    >
      <RotateCcw className="mt-0.5 size-5 shrink-0 text-warning" />
      <div className="flex flex-1 flex-col gap-2">
        <p className="text-sm font-semibold text-warning">
          Your previous message was rolled back
        </p>
        {/* Quoted so the preview reads as the user's own words, not as a
            second attempt from the system. Truncated at write-time (see
            rollback-hints-store), so the display is already safe. */}
        <p className="text-sm text-body italic wrap-break-word">
          &ldquo;{hint.attemptedMessage}&rdquo;
        </p>
        <p className="text-xs text-muted">Reason: {hint.reason}</p>
      </div>
      <button
        type="button"
        onClick={() => clear(sessionId)}
        aria-label="Dismiss"
        className="rounded-md p-1 text-muted transition-colors hover:bg-hover hover:text-heading"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
