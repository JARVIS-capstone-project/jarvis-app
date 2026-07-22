/**
 * Chat domain types. Kept lean on purpose — extend as the feature grows
 * (streaming state, tool calls, etc. all land as separate fields once
 * their tickets ship).
 */

export type MessageRole = 'user' | 'assistant'

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
   * Files the user attached to this send. Two flavours:
   *   - `ChatAttachment` — live (this session), carries a `File` + blob URL.
   *     Message-bubble renders it via `AttachmentTile`.
   *   - `UploadedDocument` — hydrated from BE (`GET /sessions/{id}`); has
   *     no local `File`. Message-bubble renders it via `StoredAttachmentTile`,
   *     which resolves preview via IndexedDB → BE signed URL.
   * The two are distinguishable by the presence of the `file` property.
   */
  attachments?: (ChatAttachment | UploadedDocument)[]
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
