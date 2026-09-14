/**
 * Refusal-token detection.
 *
 * The agent signals "I could not confidently answer this" by writing a
 * sentinel token INTO the streamed answer text — there is no separate
 * error frame for it. The wrapped form the orchestrator emits is:
 *
 *   NO_CONFIDENT_MATCH — I drafted an answer, but {why}, so I am not
 *   showing it.
 *
 * The token also appears bare, as `NO_CONFIDENT_MATCH` alone. Both are
 * emitted as the message body; the UI recognises them here and swaps the
 * bubble for a dedicated refusal card so the raw token never renders.
 *
 * False-positive avoidance is intentionally minimal: we only match when
 * the token is at the very start of the (trimmed) message body. The
 * agent's own KB documents the token, but that content is only cited,
 * never emitted as the answer's leading line — so anchoring to the start
 * costs no real refusals and rejects every incidental mention.
 */

const REFUSAL_TOKEN = 'NO_CONFIDENT_MATCH'

/** True when this looks like a refusal — token at the start of the body. */
export function isRefusal(content: string): boolean {
  return content.trimStart().startsWith(REFUSAL_TOKEN)
}

/**
 * Pulls the "why" clause out of the wrapped form. Returns null when the
 * body is the bare token or the wrapper's shape doesn't match — the
 * renderer falls back to a generic sentence in that case.
 *
 * The wrapper is `NO_CONFIDENT_MATCH — I drafted an answer, but {why},
 * so I am not showing it.` — we split on the em dash and strip the
 * boilerplate around the reason.
 */
export function parseRefusalReason(content: string): string | null {
  if (!isRefusal(content)) return null
  const trimmed = content.trim()
  // Everything after the first em dash (or " - " ASCII fallback).
  const dashIdx = trimmed.indexOf('—')
  const sepIdx = dashIdx !== -1 ? dashIdx : trimmed.indexOf(' - ')
  if (sepIdx === -1) return null
  const after = trimmed.slice(sepIdx + 1).trim()
  // Strip the orchestrator's boilerplate; keep just the reason clause.
  const match = after.match(/I drafted an answer,?\s*but\s+(.+?)[,.]?\s*so I am not showing it\.?/i)
  if (match) return match[1].trim()
  // Not the boilerplate form — hand back whatever followed the dash so
  // future wording changes still produce something readable.
  return after || null
}
