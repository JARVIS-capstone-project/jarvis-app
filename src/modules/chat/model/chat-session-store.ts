import { create } from 'zustand'
import type {
  ChatAttachment,
  ChatMessage,
  UploadedDocument,
} from '@modules/chat/model/types'

/**
 * Typed, code-driven alert surface shown above the composer. Distinct from
 * `errorBanner` (which is retry-oriented for pipeline failures) — alerts
 * flag agent conditions the user can't fix by retrying:
 *   - `upstream_rate_limited` — Gemini quota exhausted; wait it out
 *   - `requires_escalation`   — future: human-support handoff signal
 *
 * `collapsed` starts false (full banner) and flips to true when the user
 * clicks the X. In-memory only — a page reload clears the alert. Otherwise
 * it's cleared automatically when the next `/stream` call succeeds. Global
 * — not per session — because rate-limit is process-wide; switching
 * sessions doesn't help.
 */
export type ChatAlertCode = 'upstream_rate_limited' | 'requires_escalation'

export interface ChatAlert {
  code: ChatAlertCode
  collapsed: boolean
}

/**
 * Payload snapshot taken at Send-time. Restored to the composer if any
 * step of the pipeline fails (uploads / /sessions / /stream). Retains the
 * enriched `ChatAttachment[]` so retry can skip already-uploaded files
 * (they carry `sourceId`, `useUploadDocuments` short-circuits them).
 */
export interface PendingPayload {
  text: string
  attachments: ChatAttachment[]
}

export interface ChatSessionState {
  messages: ChatMessage[]
  /** True from `open()` until `onDone` fires. Used to disable the composer. */
  streaming: boolean
  /** True while `useHydrateSession` is fetching this session from the BE.
   *  ChatSection renders `<MessageSkeleton>` in this state. */
  hydrating: boolean
  /** Non-null when the current stream/upload failed; cleared on next successful Send. */
  errorBanner: string | null
  /** Composer-restore snapshot; populated on failure. */
  pendingPayload: PendingPayload | null
}

/**
 * Placeholder key for errors that occurred BEFORE a session_id existed
 * (upload failed on the very first Send, or /sessions itself failed). The
 * composer reads from this key while the URL is still `/new`.
 */
export const PRE_SESSION_KEY = '__pre_session__'

interface Store {
  byId: Record<string, ChatSessionState>
  /** Global (non-per-session) typed alert. See ChatAlert docstring. */
  alert: ChatAlert | null
  /** Sets the alert. If `code` matches the current alert, `collapsed` is
   *  preserved so a re-fire on the same condition doesn't re-expand what
   *  the user just dismissed. Different code → full-banner (collapsed=false). */
  setAlert: (code: ChatAlertCode) => void
  /** X-button handler: collapses to the short pill, does not clear. */
  dismissAlert: () => void
  /** Full removal; primarily used by tests and future clean-slate flows. */
  clearAlert: () => void
  ensure: (sessionId: string) => void
  appendMessage: (sessionId: string, msg: ChatMessage) => void
  /** Replace the message list wholesale — used by hydration from
   *  `GET /sessions/{id}`. Never called during a live stream (the hydration
   *  hook guards against that). */
  setMessages: (sessionId: string, messages: ChatMessage[]) => void
  /** Append a delta to the LAST assistant message. Also clears any lingering
   *  `thinking` (text is starting, thinking display is done). No-op if the last
   *  message isn't from the assistant (defensive against out-of-order frames). */
  patchLastAssistant: (sessionId: string, delta: string) => void
  /** Replace the LAST assistant message's rolling thinking text. Called by the
   *  thinking-queue drain — one thinking_delta at a time, spaced 0.8s. */
  setLastAssistantThinking: (sessionId: string, text: string | null) => void
  /** Stamp `response_time_ms` on the LAST assistant message. Called by the
   *  stream on `turn_end`. No-op if the last message isn't assistant. */
  setLastAssistantResponseTime: (sessionId: string, ms: number) => void
  /** Stamp `requires_escalation` on the LAST assistant message. Same
   *  lifecycle as `setLastAssistantResponseTime`. */
  setLastAssistantEscalation: (sessionId: string, v: boolean) => void
  setStreaming: (sessionId: string, v: boolean) => void
  /** Flip while `GET /sessions/{id}` is in flight. */
  setHydrating: (sessionId: string, v: boolean) => void
  setError: (
    sessionId: string,
    err: string | null,
    pending: PendingPayload | null,
  ) => void
  clearError: (sessionId: string) => void
  /** Drops the last message if it's a synthetic interrupted marker. Called
   *  before send()/resume() append new messages so the marker doesn't hang
   *  mid-list. Safe no-op when the tail isn't interrupted. */
  removeTrailingInterrupted: (sessionId: string) => void
  /** Promotes the PRE_SESSION_KEY seed to a freshly-minted `session_id` once
   *  `/sessions` returns. Copies messages + `streaming` to `toKey`, resets
   *  `fromKey` to empty state. Assumes `toKey` was just ensured (fresh). */
  migrateSession: (fromKey: string, toKey: string) => void
  /** Forgets a session's in-memory transcript. Called after a delete so the
   *  messages don't sit in the store keyed by an id the BE no longer serves —
   *  and so re-opening a recycled id can't surface the old conversation. */
  dropSession: (sessionId: string) => void
  /** Replaces the attachments on a specific message. Used to swap the
   *  freshly-picked ChatAttachments seeded on the early user bubble for their
   *  post-upload enriched shape once `/documents` returns. */
  patchMessageAttachments: (
    sessionId: string,
    messageId: string,
    attachments: (ChatAttachment | UploadedDocument)[],
  ) => void
}

const emptyState = (): ChatSessionState => ({
  messages: [],
  streaming: false,
  hydrating: false,
  errorBanner: null,
  pendingPayload: null,
})

export const useChatSessionStore = create<Store>((set) => ({
  byId: {},
  alert: null,

  setAlert: (code) =>
    set((s) => {
      const next: ChatAlert =
        s.alert && s.alert.code === code
          ? s.alert
          : { code, collapsed: false }
      return { alert: next }
    }),
  dismissAlert: () =>
    set((s) => (s.alert ? { alert: { ...s.alert, collapsed: true } } : s)),
  clearAlert: () => set({ alert: null }),

  ensure: (sessionId) =>
    set((s) =>
      s.byId[sessionId]
        ? s
        : { byId: { ...s.byId, [sessionId]: emptyState() } },
    ),

  appendMessage: (sessionId, msg) =>
    set((s) => {
      const cur = s.byId[sessionId] ?? emptyState()
      return {
        byId: {
          ...s.byId,
          [sessionId]: { ...cur, messages: [...cur.messages, msg] },
        },
      }
    }),

  setMessages: (sessionId, messages) =>
    set((s) => {
      const cur = s.byId[sessionId] ?? emptyState()
      return {
        byId: {
          ...s.byId,
          [sessionId]: { ...cur, messages },
        },
      }
    }),

  patchLastAssistant: (sessionId, delta) =>
    set((s) => {
      const cur = s.byId[sessionId] ?? emptyState()
      const msgs = [...cur.messages]
      const last = msgs[msgs.length - 1]
      if (!last || last.role !== 'assistant') return s
      // Clear `thinking` unconditionally: once text starts flowing, the
      // thinking-status line has served its purpose and should disappear.
      msgs[msgs.length - 1] = {
        ...last,
        content: last.content + delta,
        thinking: null,
      }
      return { byId: { ...s.byId, [sessionId]: { ...cur, messages: msgs } } }
    }),

  setLastAssistantThinking: (sessionId, text) =>
    set((s) => {
      const cur = s.byId[sessionId] ?? emptyState()
      const msgs = [...cur.messages]
      const last = msgs[msgs.length - 1]
      if (!last || last.role !== 'assistant') return s
      msgs[msgs.length - 1] = { ...last, thinking: text }
      return { byId: { ...s.byId, [sessionId]: { ...cur, messages: msgs } } }
    }),

  setLastAssistantResponseTime: (sessionId, ms) =>
    set((s) => {
      const cur = s.byId[sessionId] ?? emptyState()
      const msgs = [...cur.messages]
      const last = msgs[msgs.length - 1]
      if (!last || last.role !== 'assistant') return s
      msgs[msgs.length - 1] = { ...last, responseTimeMs: ms }
      return { byId: { ...s.byId, [sessionId]: { ...cur, messages: msgs } } }
    }),

  setLastAssistantEscalation: (sessionId, v) =>
    set((s) => {
      const cur = s.byId[sessionId] ?? emptyState()
      const msgs = [...cur.messages]
      const last = msgs[msgs.length - 1]
      if (!last || last.role !== 'assistant') return s
      msgs[msgs.length - 1] = { ...last, requiresEscalation: v }
      return { byId: { ...s.byId, [sessionId]: { ...cur, messages: msgs } } }
    }),

  setStreaming: (sessionId, v) =>
    set((s) => {
      const cur = s.byId[sessionId] ?? emptyState()
      return { byId: { ...s.byId, [sessionId]: { ...cur, streaming: v } } }
    }),

  setHydrating: (sessionId, v) =>
    set((s) => {
      const cur = s.byId[sessionId] ?? emptyState()
      return { byId: { ...s.byId, [sessionId]: { ...cur, hydrating: v } } }
    }),

  setError: (sessionId, err, pending) =>
    set((s) => {
      const cur = s.byId[sessionId] ?? emptyState()
      return {
        byId: {
          ...s.byId,
          [sessionId]: {
            ...cur,
            errorBanner: err,
            pendingPayload: pending,
            streaming: false,
          },
        },
      }
    }),

  clearError: (sessionId) =>
    set((s) => {
      const cur = s.byId[sessionId] ?? emptyState()
      return {
        byId: {
          ...s.byId,
          [sessionId]: { ...cur, errorBanner: null, pendingPayload: null },
        },
      }
    }),

  removeTrailingInterrupted: (sessionId) =>
    set((s) => {
      const cur = s.byId[sessionId]
      if (!cur) return s
      const last = cur.messages[cur.messages.length - 1]
      if (!last?.interrupted) return s
      return {
        byId: {
          ...s.byId,
          [sessionId]: { ...cur, messages: cur.messages.slice(0, -1) },
        },
      }
    }),

  migrateSession: (fromKey, toKey) =>
    set((s) => {
      const from = s.byId[fromKey]
      if (!from) return s
      return {
        byId: {
          ...s.byId,
          [toKey]: {
            ...emptyState(),
            messages: from.messages,
            streaming: from.streaming,
          },
          [fromKey]: emptyState(),
        },
      }
    }),

  dropSession: (sessionId) =>
    set((s) => {
      if (!s.byId[sessionId]) return s
      const next = { ...s.byId }
      delete next[sessionId]
      return { byId: next }
    }),

  patchMessageAttachments: (sessionId, messageId, attachments) =>
    set((s) => {
      const cur = s.byId[sessionId]
      if (!cur) return s
      const idx = cur.messages.findIndex((m) => m.id === messageId)
      if (idx === -1) return s
      const msgs = [...cur.messages]
      msgs[idx] = { ...msgs[idx], attachments }
      return { byId: { ...s.byId, [sessionId]: { ...cur, messages: msgs } } }
    }),
}))

/**
 * Selector that always returns a stable empty-state object shape so
 * consumers don't have to null-guard every access. Safe to destructure.
 */
export const useChatSession = (sessionId: string | null): ChatSessionState => {
  return useChatSessionStore((s) =>
    sessionId ? (s.byId[sessionId] ?? EMPTY) : EMPTY,
  )
}

// Frozen singleton so the selector returns a REFERENCE-STABLE value when
// nothing exists yet — avoids re-render churn from `emptyState()` being
// a fresh object every read.
const EMPTY: ChatSessionState = Object.freeze({
  messages: [],
  streaming: false,
  hydrating: false,
  errorBanner: null,
  pendingPayload: null,
}) as ChatSessionState
