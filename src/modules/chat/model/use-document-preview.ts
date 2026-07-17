import { useEffect, useState } from 'react'
import { kbService } from '@modules/chat/api/kb-service'
import { documentBlobCache } from '@modules/chat/model/document-blob-cache'
import type { ChatAttachment, UploadedDocument } from '@modules/chat/model/types'

/**
 * "What are we trying to preview?" — either a live composer/bubble
 * attachment (fastest path, blob URL already in memory) or a stored
 * document (post-reload path, may need IndexedDB or BE fetch).
 */
export type PreviewTarget =
  | { kind: 'live'; attachment: ChatAttachment }
  | { kind: 'stored'; document: UploadedDocument }

export type PreviewStatus = 'loading' | 'ready' | 'expired' | 'error'

interface Result {
  url: string | null
  status: PreviewStatus
  filename: string
  contentType: string
}

/**
 * Resolves a displayable URL for a preview target. Cost-ordered walk:
 *   1. Live blob URL       (in-memory, this session — instant)
 *   2. IndexedDB blob      (post-reload, cache hit — instant, no network)
 *   3. BE signed URL       (last resort — ~200 ms round-trip)
 *
 * The BE signed URL lives ONLY in this hook's state. Unmount drops it —
 * never written to any store or cache. Object URLs created from IndexedDB
 * blobs are revoked on unmount too; the live-blob URL is NOT revoked here
 * (owned by the composer/message layer).
 *
 * Consumers conditionally mount the modal with a non-null target, so the
 * type is non-nullable — the hook doesn't need a null branch.
 */
export function useDocumentPreview(target: PreviewTarget): Result {
  const [state, setState] = useState<{ url: string | null; status: PreviewStatus }>({
    url: null,
    status: 'loading',
  })

  useEffect(() => {
    let cancelled = false
    let createdObjectUrl: string | null = null

    ;(async () => {
      // Path 1: live blob URL — already valid, no work needed.
      if (target.kind === 'live') {
        setState({ url: target.attachment.previewUrl, status: 'ready' })
        return
      }

      const doc = target.document
      // Failed upload: no sourceId, no bytes anywhere. Show error state.
      if (!doc.sourceId) {
        setState({ url: null, status: 'error' })
        return
      }

      // Path 2: IndexedDB cache.
      const cached = await documentBlobCache.read(doc.sourceId)
      if (cancelled) return
      if (cached) {
        createdObjectUrl = URL.createObjectURL(cached)
        setState({ url: createdObjectUrl, status: 'ready' })
        return
      }

      // Path 3: BE signed URL. httpClient throws on non-2xx; we branch on
      // 410 (file past its 24h TTL) vs any other error.
      //
      // The signed URL lives only in this component's state — never written
      // to documents-store or IndexedDB. On unmount (close) it just falls
      // out of memory. The BE DTO explicitly warns against persisting it.
      //
      // TODO(BE-two-urls): swap `res.file_url` for `res.preview_url` when BE
      // ships the preview+download URL pair (see kb-service.ts).
      try {
        const res = await kbService.getDocumentContent(doc.sourceId)
        if (cancelled) return
        setState({ url: res.file_url, status: 'ready' })
      } catch (err) {
        if (cancelled) return
        setState({ url: null, status: isGone(err) ? 'expired' : 'error' })
      }
    })()

    return () => {
      cancelled = true
      // Only revoke URLs WE created — never touch the live blob URL owned
      // by the composer/message layer.
      if (createdObjectUrl) URL.revokeObjectURL(createdObjectUrl)
    }
  }, [target])

  return {
    url: state.url,
    status: state.status,
    filename: nameOf(target),
    contentType: typeOf(target),
  }
}

function nameOf(target: PreviewTarget): string {
  return target.kind === 'live' ? target.attachment.file.name : target.document.filename
}

function typeOf(target: PreviewTarget): string {
  return target.kind === 'live' ? target.attachment.file.type : target.document.contentType
}

// httpClient throws `Error("Request failed: 410 Gone")` — substring match
// on '410' is good enough until we swap httpClient for a richer error type.
function isGone(err: unknown): boolean {
  return err instanceof Error && err.message.includes('410')
}
