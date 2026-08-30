import { useCallback } from 'react'
import { kbService } from '@modules/chat/api/kb-service'
import { documentBlobCache } from '@modules/chat/model/document-blob-cache'
import { useDocumentsStore } from '@modules/chat/model/documents-store'
import type { ChatAttachment } from '@modules/chat/model/types'

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
            const errorMessage = err instanceof Error ? err.message : 'Upload failed'
            // Record the failure so /dev/document can display it.
            addDoc({
              key: crypto.randomUUID(),
              filename: a.file.name,
              contentType: a.file.type,
              sizeBytes: a.file.size,
              status: 'failed',
              errorMessage,
            })
            return { ...a, uploadStatus: 'failed', errorMessage }
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
