import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

/**
 * Per-session hints that a turn was rolled back BE-side.
 *
 * The problem this exists to solve: when the very first turn of a new
 * session is rolled back (the answer failed the faithfulness gate, or
 * upstream flaked), the BE reverts it. On refresh, `GET /sessions/{id}`
 * returns zero messages and the chat pane renders as if nothing ever
 * happened — the user has no idea their message was even received.
 *
 * The chat-session store's message state is in-memory only and clears on
 * reload, so a hint written there disappears at exactly the wrong moment.
 * This store persists to localStorage so the notice survives the F5 that
 * the user is most likely to hit after the empty session confuses them.
 *
 * Scope: same tradeoffs as `documents-store` — origin-wide, no per-user
 * key. Acceptable because hints self-clear as soon as the session
 * successfully hydrates OR the user dismisses the notice. Cross-device
 * reload does NOT surface the hint (it lives only in the browser that
 * originated the rolled-back send) — that gap is B2 in the design and
 * needs BE support, which is out of scope here.
 */

export interface RollbackHint {
  /** Truncated preview of the message the user attempted — capped at
   *  MAX_PREVIEW so localStorage stays tidy and the banner stays short. */
  attemptedMessage: string
  /** Human-readable reason. Derived from BE `finish_reason` when available,
   *  otherwise a generic explanation. Not machine-readable — the banner
   *  just prints it. */
  reason: string
  /** ISO timestamp when the rollback was detected. Reserved for future
   *  UI (e.g. relative time on the banner). */
  at: string
}

interface RollbackHintsState {
  hints: Record<string, RollbackHint>
  set: (sessionId: string, hint: RollbackHint) => void
  clear: (sessionId: string) => void
}

const MAX_PREVIEW = 200

export const useRollbackHintsStore = create<RollbackHintsState>()(
  persist(
    (set) => ({
      hints: {},
      set: (sessionId, hint) =>
        set((s) => ({
          hints: {
            ...s.hints,
            [sessionId]: {
              ...hint,
              attemptedMessage: hint.attemptedMessage.slice(0, MAX_PREVIEW),
            },
          },
        })),
      clear: (sessionId) =>
        set((s) => {
          if (!s.hints[sessionId]) return s
          const next = { ...s.hints }
          delete next[sessionId]
          return { hints: next }
        }),
    }),
    {
      name: 'jarvis.rollback-hints',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ hints: s.hints }),
    },
  ),
)

/** Convenience selector — undefined when no hint exists for this session. */
export const useRollbackHint = (
  sessionId: string | null | undefined,
): RollbackHint | undefined =>
  useRollbackHintsStore((s) => (sessionId ? s.hints[sessionId] : undefined))
