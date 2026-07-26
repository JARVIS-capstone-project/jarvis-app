import { create } from 'zustand'
import type { ChatAttachment, ChatMessage } from '@modules/chat/model/types'

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
  setStreaming: (sessionId: string, v: boolean) => void
  /** Flip while `GET /sessions/{id}` is in flight. */
  setHydrating: (sessionId: string, v: boolean) => void
  setError: (
    sessionId: string,
    err: string | null,
    pending: PendingPayload | null,
  ) => void
  clearError: (sessionId: string) => void
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
