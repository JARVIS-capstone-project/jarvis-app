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
  /** Anchor target for the Download button. Same value as `url` when the
   *  source is a blob (live or IndexedDB cache) — blob URLs download fine
   *  with a `download` attribute on the anchor. Different value when the
   *  BE gave us a dedicated attachment-signed URL. Null while loading or
   *  when the file is expired/errored. */
  downloadUrl: string | null
  status: PreviewStatus
  filename: string
  contentType: string
}

/**
 * Resolves a displayable URL for a preview target. Cost-ordered walk:
 *   1. Live blob URL       (in-memory, this session — instant)
 *   2. IndexedDB blob      (post-reload, cache hit — instant, no network)
 *   3. BE signed URLs      (last resort — ~200 ms round-trip)
 *
 * The BE returns TWO signed URLs: `preview_url` (inline disposition for
 * rendering) and `download_url` (attachment disposition for the Download
 * button). Both live ONLY in this hook's state — never written to any
 * store or cache. Object URLs created from IndexedDB blobs are revoked
 * on unmount too; the live-blob URL is NOT revoked here (owned by the
 * composer/message layer).
 *
 * Consumers conditionally mount the modal with a non-null target, so the
 * type is non-nullable — the hook doesn't need a null branch.
 */
export function useDocumentPreview(target: PreviewTarget): Result {
  const [state, setState] = useState<{
    url: string | null
    downloadUrl: string | null
    status: PreviewStatus
  }>({
    url: null,
    downloadUrl: null,
    status: 'loading',
  })

  useEffect(() => {
    let cancelled = false
    let createdObjectUrl: string | null = null

    ;(async () => {
      // Path 1: live blob URL — already valid, no work needed. Same blob
      // URL doubles as the download target (browsers download blob URLs
      // when the anchor carries a `download` attr).
      if (target.kind === 'live') {
        setState({
          url: target.attachment.previewUrl,
          downloadUrl: target.attachment.previewUrl,
          status: 'ready',
        })
        return
      }

      const doc = target.document
      // Failed upload: no sourceId, no bytes anywhere. Show error state.
      if (!doc.sourceId) {
        setState({ url: null, downloadUrl: null, status: 'error' })
        return
      }

      // Path 2: IndexedDB cache. Blob URL downloads fine via the anchor's
      // `download` attribute — reuse the same URL for both preview + save.
      const cached = await documentBlobCache.read(doc.sourceId)
      if (cancelled) return
      if (cached) {
        createdObjectUrl = URL.createObjectURL(cached)
        setState({
          url: createdObjectUrl,
          downloadUrl: createdObjectUrl,
          status: 'ready',
        })
        return
      }

      // Path 3: BE signed URLs. httpClient throws on non-2xx; we branch on
      // 410 (file past its 24h TTL) vs any other error.
      //
      // Signed URLs live only in this component's state — never written to
      // documents-store or IndexedDB. On unmount (close) they just fall
      // out of memory. The BE DTO explicitly warns against persisting them.
      try {
        const res = await kbService.getDocumentContent(doc.sourceId)
        if (cancelled) return
        setState({
          url: res.preview_url,
          downloadUrl: res.download_url,
          status: 'ready',
        })
      } catch (err) {
        if (cancelled) return
        setState({
          url: null,
          downloadUrl: null,
          status: isGone(err) ? 'expired' : 'error',
        })
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
    downloadUrl: state.downloadUrl,
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
