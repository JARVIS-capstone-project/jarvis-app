import { create } from 'zustand'
import type { SessionSummary } from '@modules/chat/api/agent-types'

/**
 * Sidebar-facing list of the caller's sessions. Hydrated on demand from
 * `GET /agent/sessions` by SessionHistory; `addOptimistic` is called by
 * `use-chat-send` when a new session is minted so the sidebar reflects it
 * before the next full refresh.
 *
 * Not persisted — BE is the source of truth. On page reload the sidebar's
 * effect will refetch. Same origin-wide scope caveat as `documents-store`
 * (revisit when a real per-user scope lands).
 */
interface SessionsState {
  sessions: SessionSummary[]
  loading: boolean
  addOptimistic: (s: SessionSummary) => void
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
  setAll: (list) => set({ sessions: list }),
  setLoading: (v) => set({ loading: v }),
}))

export const useSessions = () => useSessionsStore((s) => s.sessions)
export const useSessionsLoading = () => useSessionsStore((s) => s.loading)
