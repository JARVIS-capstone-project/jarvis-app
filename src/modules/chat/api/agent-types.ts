/**
 * Wire-format types for agent-system's HTTP + SSE surface. Snake_case is
 * preserved on the wire — the FE domain layer converts to camelCase when
 * it stores or displays these values (same convention as `kb-service.ts`).
 *
 * BE source of truth: agent-system/src/jarvis_agent/modules/sessions/schemas.py
 */

/* ---------- Session CRUD ------------------------------------------------- */

export interface CreateSessionRequest {
  /** Max 300 chars server-side. Omit → BE defaults to "New incident". */
  title?: string
  /** 'P1' | 'P2' | 'P3' | 'P4' — but the DB column is VARCHAR(2). Null →
   *  BE auto-classifies from the first message. Never send arbitrary text. */
  severity?: string | null
}

export interface UpdateSessionRequest {
  title?: string
  severity?: string | null
}

export interface SessionSummary {
  session_id: string
  user_id: string
  title: string
  severity: string | null
  status: string
  last_message_preview: string | null
  total_turns: number
  created_at: string
  updated_at: string
  expires_at: string | null
}

export interface SessionDetail extends SessionSummary {
  messages: MessageDTO[]
}

export interface MessageDTO {
  role: string
  content: string
  attachments?: AttachmentIn[]
}

/* ---------- Chat / attachments ------------------------------------------- */

/**
 * Frozen 4-key chip DTO — must match `AttachmentIn` on the BE (private-kb
 * SYNC-1 §6). `source_id` MUST be a UUID string; validation on the BE
 * rejects anything else with 422.
 */
export interface AttachmentIn {
  source_id: string
  filename: string
  content_type: string
  size_bytes: number
}

export interface ChatRequest {
  /** Max 4000 chars server-side. */
  message: string
  /** Optional — server generates a UUID hex if omitted. */
  trace_id?: string
  /** Duplicate `source_id`s in the same request → 422. */
  attachments?: AttachmentIn[]
}

/** Non-streaming variant response. Not used by this integration (we use
 *  /stream), but declared so `agentService.sendMessage` is well-typed if
 *  we ever need the synchronous path. */
export interface ChatResponse {
  trace_id: string
  session_id: string
  answer: string
  tool_calls: string[]
  citations: string[]
  confidence_score: number | null
  requires_escalation: boolean
  untrusted_sources: string[]
  ok: boolean
  error: string | null
}

/* ---------- SSE frame shapes --------------------------------------------- */

/**
 * Typed union of every SSE event the agent emits. Names mirror
 * `agent-system/src/jarvis_agent/modules/triage/orchestrator.py` exactly —
 * the parser dispatches on the event string, so any mismatch silently drops
 * the frame (the bug that shipped in the first cut).
 *
 * Only `text_delta` and `error` are wired to UI today; the rest are typed
 * so the parser and switch statements don't blow up, but downstream code
 * ignores them until a follow-up ticket wires per-event UI (thinking
 * indicator, tool chips, warning banners).
 */
export type SseFrame =
  | { event: 'turn_start'; data: { trace_id: string; session_id: string } }
  | { event: 'text_delta'; data: { delta: string } }
  | { event: 'thinking_delta'; data: { delta: string } }
  | { event: 'thinking_end'; data: Record<string, never> }
  | { event: 'tool_start'; data: { tool_name: string; tool_use_id: string } }
  | { event: 'tool_result'; data: { tool_name: string; success: boolean } }
  | { event: 'warning'; data: { message: string } }
  | { event: 'error'; data: { message: string; code?: string } }
  | {
      event: 'turn_end'
      data: {
        trace_id?: string
        session_id?: string
        tool_calls?: string[]
        citations?: string[]
        confidence_score: number | null
        requires_escalation?: boolean
        finish_reason?: string
        fallback?: boolean
        ok?: boolean
        error?: string | null
      }
    }
