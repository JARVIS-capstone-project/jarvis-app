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
 * Once real upload lands the shape gets extended with an `id`/`url` from
 * the BE; consumers keep reading `file.name`, `file.size`, `previewUrl`.
 */
export interface ChatAttachment {
  /** Stable React key + revoke target — unrelated to the file's contents. */
  key: string
  file: File
  /** `blob:http://...` URL for click-to-open previews. */
  previewUrl: string
}

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  /** Unix ms — set at append time via Date.now(). */
  createdAt: number
  /** Files the user attached to this send. Omitted when empty. */
  attachments?: ChatAttachment[]
}
