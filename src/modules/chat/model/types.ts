/**
 * Chat domain types. Kept lean on purpose — extend as the feature grows
 * (streaming state, tool calls, etc. all land as separate fields once
 * their tickets ship).
 */

import type { CitationRef } from '@modules/chat/api/agent-types'

export type MessageRole = 'user' | 'assistant'

/**
 * Which producer a status line came from, and therefore how its text is read.
 *
 * `thinking` is Gemini's raw reasoning stream — `**Heading**\n\nBody…` — where
 * only the latest heading is worth showing. The validation kinds are finished
 * sentences from the faithfulness gate and are rendered whole.
 *
 * `validation-error` is separate from `validation` rather than a flag on it:
 * "the check could not run" is not a finding about the answer, and a surface
 * that rendered the two alike would teach an operator to read a broken judge
 * as a clean bill of health.
 */
export type StatusLineKind = 'thinking' | 'validation' | 'validation-error'

/** One line of the pre-answer status pane. */
export interface StatusLine {
  kind: StatusLineKind
  text: string
}

/**
 * A file the user attached in the composer. Held entirely client-side as
 * a Blob — the `previewUrl` is a `blob:` URL created via URL.createObjectURL,
 * scoped to the current tab and revoked once the file is no longer referenced
 * (removed from composer, or store cleared).
 *
 * `uploadStatus` tracks the KB upload lifecycle: 'pending' when just picked,
 * 'uploading' during POST /documents, then 'done' (with server-issued
 * `sourceId` + `jobId`) or 'failed' (with `errorMessage`, no sourceId).
 */
export interface ChatAttachment {
  /** Stable React key + revoke target — unrelated to the file's contents. */
  key: string
  file: File
  /** `blob:http://...` URL for click-to-open previews. */
  previewUrl: string
  uploadStatus: UploadStatus
  /** Set once POST /documents returns 201. Undefined until 'done'. */
  sourceId?: string
  /** Set after POST /documents returns — success OR failure. */
  jobId?: string
  /** Set on 'failed'. */
  errorMessage?: string
}

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  /** Unix ms — set at append time via Date.now(). */
  createdAt: number
  /**
   * Currently-displayed status line for a live assistant message — the model's
   * reasoning, or the faithfulness gate's progress. Rolling: each new line
   * REPLACES this (not accumulates), paced by `StatusQueue`. Cleared as soon
   * as the first `text_delta` lands so `content` takes over. Never persisted:
   * only exists during an active stream, always undefined post-turn_end.
   */
  status?: StatusLine | null
  /**
   * True when this message is a synthetic "The process was interrupted."
   * marker written client-side after hydration detected the previous stream
   * was cut off (last persisted message is a user with no assistant reply).
   * Never persisted to the BE — `useHydrateSession` re-synthesises it on
   * every hydration if the interrupted-state condition still holds. Rendered
   * dim by `MessageBubble` so it reads as a status label, not an answer.
   */
  interrupted?: boolean
  /**
   * Files the user attached to this send. Two flavours:
   *   - `ChatAttachment` — live (this session), carries a `File` + blob URL.
   *     Message-bubble renders it via `AttachmentTile`.
   *   - `UploadedDocument` — hydrated from BE (`GET /sessions/{id}`); has
   *     no local `File`. Message-bubble renders it via `StoredAttachmentTile`,
   *     which resolves preview via IndexedDB → BE signed URL.
   * The two are distinguishable by the presence of the `file` property.
   */
  attachments?: (ChatAttachment | UploadedDocument)[]
  /**
   * Wall-clock the agent spent on this turn, in milliseconds. Assistant
   * messages only. Populated on hydration (`turn.response_time_ms`) and on
   * the live path when the `turn_end` frame arrives. MessageBubble renders
   * it as a caption above the bubble.
   */
  responseTimeMs?: number | null
  /**
   * True when the agent flagged this turn for human escalation. Assistant
   * messages only. Populated the same way as `responseTimeMs`. Message
   * bubble renders an inline "Human escalation" chip next to the
   * response-time caption; the global ChatAlert also fires on the live
   * stream, so the user sees it in two places (banner AND per-message).
   */
  requiresEscalation?: boolean | null
  /**
   * Documents this answer rests on, resolved for display. Assistant messages
   * only. Populated on hydration (`turn.citation_refs`) and on the live path
   * when `turn_end` arrives — the BE emits the same shape on both, so the
   * rendered list does not depend on how the message reached the client.
   */
  citationRefs?: CitationRef[] | null
}

/**
 * Full upload-status set used across the composer lifecycle. The persisted
 * `UploadedDocument.status` is a strict subset (only terminal states) —
 * see below.
 */
export type UploadStatus = 'pending' | 'uploading' | 'done' | 'failed'

/**
 * A file the user has attempted to upload via POST /api/kb/documents.
 * Lives in the persisted documents store (localStorage) so `/dev/document`
 * survives F5. Bytes are stored separately in IndexedDB keyed by `sourceId`
 * (see `document-blob-cache.ts`).
 *
 * `sourceId` is undefined on `failed` attempts (BE never issued one). The
 * `key` field is the stable local identifier used across all UI ops.
 */
export interface UploadedDocument {
  /** Stable local UI key (crypto.randomUUID) — the only identifier for
   *  failed uploads that never received a sourceId. */
  key: string
  /** Set once POST /documents returns 201. Undefined on failed uploads. */
  sourceId?: string
  /** Set once POST /documents returns — success OR failure. */
  jobId?: string
  filename: string
  contentType: string
  sizeBytes: number
  /** Only terminal outcomes get persisted — pending/uploading are transient. */
  status: Extract<UploadStatus, 'done' | 'failed'>
  /** ISO timestamps from the BE — set on 'done' only. */
  createdAt?: string
  fileExpiresAt?: string
  /** Error message from KbFailureResponse — set on 'failed' only. */
  errorMessage?: string
}
