import { ShieldQuestion } from 'lucide-react'

interface RefusalCardProps {
  /** The "why" clause parsed off the token wrapper. `null` when the agent
   *  emitted just the bare token; the fallback line covers that case. */
  reason: string | null | undefined
}

/**
 * Assistant-bubble variant shown when the agent could not confidently
 * answer. Replaces the default markdown body when `ChatMessage.variant`
 * is `'refusal'` — the raw NO_CONFIDENT_MATCH token that would otherwise
 * be on `content` is suppressed by the store promotion.
 *
 * Reads like a card, not an error banner: the agent DID a thing (looked,
 * decided the evidence was too thin), so the surface is neutral and
 * explanatory rather than alarming. Copy names the way forward so the
 * user isn't left staring at a dead-end.
 */
export function RefusalCard({ reason }: RefusalCardProps) {
  return (
    <div className="flex gap-3 rounded-2xl border border-divider bg-surface px-4 py-3">
      <ShieldQuestion className="mt-0.5 size-5 shrink-0 text-muted" />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-heading">
          No confident answer
        </p>
        <p className="text-sm text-body">
          {reason
            ? `I couldn't answer confidently because ${reason}`
            : "I couldn't find enough grounded evidence to answer this confidently."}
        </p>
        <p className="text-xs text-muted">
          Try rephrasing, adding more context, or attaching a document.
        </p>
      </div>
    </div>
  )
}
