import { useCallback } from 'react'
import { kbService } from '@modules/chat/api/kb-service'
import { documentBlobCache } from '@modules/chat/model/document-blob-cache'
import { useDocumentsStore } from '@modules/chat/model/documents-store'
import type { ChatAttachment, KbRejectionCode } from '@modules/chat/model/types'
import { HttpApiError } from '@shared/api/http-client'

/**
 * Reads a malware verdict off a thrown upload error.
 *
 * Prefers the BE's machine code, falling back to the 422 status because the
 * code only survives if the body parsed — and a malware refusal the UI
 * mistakes for a network blip is the failure mode worth defending against.
 *
 * Every other refusal (unscannable, oversized, storage) returns null and
 * takes the ordinary `failed` path with its generic retry banner.
 */
function rejectionOf(err: unknown): KbRejectionCode | null {
  if (!(err instanceof HttpApiError)) return null
  if (err.code === 'MALWARE_DETECTED') return 'MALWARE_DETECTED'
  if (err.status === 422) return 'MALWARE_DETECTED'
  return null
}

/** Fallback copy, used when the BE sent no message. */
const FALLBACK_MESSAGE = 'This file was rejected by malware scanning.'

/**
 * Parallel upload orchestrator. Fires POST /documents once per attachment
 * that doesn't yet have a `sourceId` (i.e. skips already-uploaded ones on
 * retry). Writes:
 *   - IndexedDB: the raw file bytes keyed by sourceId (per-success)
 *   - documents-store: metadata row (per-success AND per-failure) — so
 *     /dev/document sees every attempt as an audit trail.
 *
 * Returns the attachments with `uploadStatus` / `sourceId` / `jobId` /
 * `errorMessage` filled in. Callers (chat-input) inspect the result to
 * decide whether to commit the message or keep the composer open.
 */
export function useUploadDocuments() {
  const addDoc = useDocumentsStore((s) => s.add)

  return useCallback(
    async (attachments: ChatAttachment[]): Promise<ChatAttachment[]> => {
      const settled = await Promise.allSettled(
        attachments.map(async (a): Promise<ChatAttachment> => {
          // Idempotent skip: already-uploaded on a prior partial-fail retry.
          if (a.sourceId) return { ...a, uploadStatus: 'done' }

          try {
            const res = await kbService.uploadDocument(a.file)
            // Persist bytes so post-reload preview can rebuild a blob URL.
            await documentBlobCache.put(res.source_id, a.file)
            // Persist metadata (survives F5).
            addDoc({
              key: crypto.randomUUID(),
              sourceId: res.source_id,
              jobId: res.job_id,
              filename: res.filename,
              contentType: res.content_type,
              sizeBytes: res.size_bytes,
              status: 'done',
              createdAt: res.created_at,
              fileExpiresAt: res.file_expires_at,
            })
            return {
              ...a,
              uploadStatus: 'done',
              sourceId: res.source_id,
              jobId: res.job_id,
            }
          } catch (err) {
            // A verdict on the bytes (malware, unscannable, oversized) is a
            // different outcome from the transport failing, and the two get
            // different terminal states — see `UploadStatus`.
            const rejectionCode = rejectionOf(err)
            // The BE's own message is preferred — it names the signature that
            // matched. `err.detail` is null when the body didn't parse, which
            // is what the per-code fallback copy is for.
            const beDetail = err instanceof HttpApiError ? err.detail : null
            const errorMessage = rejectionCode
              ? (beDetail ?? FALLBACK_MESSAGE)
              : err instanceof Error
                ? err.message
                : 'Upload failed'
            const status = rejectionCode ? 'rejected' : 'failed'
            // Record the attempt so /dev/document can display it. Nothing was
            // stored BE-side on a rejection, so there is no sourceId or jobId
            // to carry — the row is the only trace the attempt happened.
            addDoc({
              key: crypto.randomUUID(),
              filename: a.file.name,
              contentType: a.file.type,
              sizeBytes: a.file.size,
              status,
              errorMessage,
              ...(rejectionCode ? { rejectionCode } : {}),
            })
            return {
              ...a,
              uploadStatus: status,
              errorMessage,
              ...(rejectionCode ? { rejectionCode } : {}),
            }
          }
        }),
      )

      // Promise.allSettled never throws — but map by position to keep order.
      return settled.map((s, i) =>
        s.status === 'fulfilled'
          ? s.value
          : { ...attachments[i], uploadStatus: 'failed' as const },
      )
    },
    [addDoc],
  )
}
