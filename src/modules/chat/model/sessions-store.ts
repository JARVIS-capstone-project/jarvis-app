import { create } from 'zustand'
import type { SessionSummary } from '@modules/chat/api/agent-types'

/**
 * Sidebar-facing list of the caller's sessions. Hydrated on demand from
 * `GET /agent/sessions` by SessionHistory; `addOptimistic` is called by
 * `use-chat-send` when a new session is minted so the sidebar reflects it
 * before the next full refresh, and `touchSession` when a turn commits so
 * the row's preview tracks the latest message without a refetch.
 *
 * Not persisted — BE is the source of truth. On page reload the sidebar's
 * effect will refetch. Same origin-wide scope caveat as `documents-store`
 * (revisit when a real per-user scope lands).
 */
interface SessionsState {
  sessions: SessionSummary[]
  loading: boolean
  addOptimistic: (s: SessionSummary) => void
  touchSession: (sessionId: string, preview: string) => void
  removeSession: (sessionId: string) => void
  setAll: (list: SessionSummary[]) => void
  setLoading: (v: boolean) => void
}

export const useSessionsStore = create<SessionsState>((set) => ({
  sessions: [],
  loading: false,
  addOptimistic: (s) =>
    set((st) => ({
      // Guard against a race where a refresh already inserted this row.
      sessions: st.sessions.some((x) => x.session_id === s.session_id)
        ? st.sessions
        : [s, ...st.sessions],
    })),
  /**
   * A turn committed on `sessionId`: point the row's preview at the message
   * that just landed, bump the turn count, and float the row to the top.
   *
   * Top is where a refetch would put it — BE orders by `updated_at` desc —
   * so doing it here keeps the list from reshuffling under the user the
   * next time SessionHistory hydrates.
   *
   * A session the store has never seen is left alone rather than
   * synthesised: the row would be missing every field but these three, and
   * the mount-time fetch will bring the real one along shortly.
   */
  touchSession: (sessionId, preview) =>
    set((st) => {
      const idx = st.sessions.findIndex((s) => s.session_id === sessionId)
      if (idx === -1) return st
      const updated: SessionSummary = {
        ...st.sessions[idx],
        last_message_preview: preview,
        total_turns: st.sessions[idx].total_turns + 1,
        updated_at: new Date().toISOString(),
      }
      return {
        sessions: [updated, ...st.sessions.filter((_, i) => i !== idx)],
      }
    }),
  /** Drop a deleted session's row. Idempotent — a filter over an id that is
   *  already gone is a no-op, so a double-confirm cannot corrupt the list. */
  removeSession: (sessionId) =>
    set((st) => ({
      sessions: st.sessions.filter((s) => s.session_id !== sessionId),
    })),
  setAll: (list) => set({ sessions: list }),
  setLoading: (v) => set({ loading: v }),
}))

export const useSessions = () => useSessionsStore((s) => s.sessions)
export const useSessionsLoading = () => useSessionsStore((s) => s.loading)
