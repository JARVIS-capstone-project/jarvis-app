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

/**
 * `DELETE /sessions/{id}`. The `source_id`s are returned for traceability —
 * they say what the session carried, not whether Platform's own cleanup
 * succeeded for each one (that path is fail-open by design). The FE uses them
 * to evict the matching entries from the local blob cache.
 */
export interface DeleteSessionResponse {
  source_ids: string[]
}

export interface MessageDTO {
  role: string
  content: string
  attachments?: AttachmentIn[]
  /** Present only on assistant messages — mirrors the BE `turn` block. Only
   *  the fields the FE currently consumes are typed; add more as needed. */
  turn?: MessageTurnDTO | null
}

export interface MessageTurnDTO {
  response_time_ms?: number
  requires_escalation?: boolean
  citation_refs?: CitationRef[]
}

/**
 * One validated citation, resolved for display. Arrives on both paths — the
 * `turn` block of `GET /sessions/{id}` and the `turn_end` frame — in the same
 * shape, so one renderer serves history and live turns alike.
 *
 * Deduplicated by the BE: a document cited three times in one answer appears
 * here once, and all three inline `cite:` links point back to this entry.
 */
export interface CitationRef {
  /** Raw id. Matches the `cite:` target of the answer's inline links. */
  source_id: string
  /** `knowledge` — a curated KB document; `attachment` — a file this user uploaded. */
  kind: 'knowledge' | 'attachment'
  /** How far to trust this source. Read this rather than deriving it from
   *  `kind` — the BE contract reserves the right to add a source type (web,
   *  MCP) that sets this without changing what `kind` means. */
  file_status: 'verified' | 'untrusted'
  /** What to show the user: the KB path, or their own filename. */
  label: string
  /** Gateway-relative content endpoint for the user's own files; `null` for KB
   *  documents, which ship inside the agent and have no endpoint. Unused today
   *  — nothing in the citation UI is clickable. */
  url: string | null
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
  // The faithfulness gate, when it runs. Conditional by design: the BE stands
  // it down for an empty answer, for a turn that retrieved nothing, and for one
  // that already declined — so a turn can go straight from `tool_result` to
  // `text_delta` with none of these frames. Never block the answer on them.
  | { event: 'validation_start'; data: { message: string } }
  | {
      event: 'validation_sources'
      data: {
        sources: { path: string; title: string; snippet: string }[]
        count: number
      }
    }
  | {
      event: 'validation_result'
      data: {
        /** No `'unavailable'` here — the BE routes that case to
         *  `validation_error` so a judge that could not run never reads as a
         *  finding about the answer. */
        status: 'verified' | 'partial' | 'unsupported'
        score: number
        message: string
        reason: string
        /** Counts only. The claims themselves are withheld on the refusal path,
         *  where that text IS the answer the gate declined to show. */
        supported_claims: number
        unsupported_claims: number
        sources_used: string[]
      }
    }
  /** Fires INSTEAD of `validation_result` when the judge itself failed. The
   *  turn fails closed: the answer is withheld and rolled back. */
  | { event: 'validation_error'; data: { message: string; code: string } }
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
        response_time_ms?: number
        /** BE reverted the turn (no answer reached the user, or the
         *  faithfulness gate withheld it). The turn does not exist server-side,
         *  so nothing derived from it — sidebar previews included — should
         *  outlive the stream. */
        rolled_back?: boolean
        /** Same shape the history path returns, so the citation UI is fed
         *  identically whether a message was streamed or hydrated. */
        citation_refs?: CitationRef[]
      }
    }
