import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChatAttachment } from '@modules/chat/model/types'

// Mirrors the platform's `kb.max-upload-size-mb` (default 25). BE remains the
// authoritative gate — this is a UX pre-check so the user doesn't spend
// bandwidth uploading a file guaranteed to 413. If BE raises the cap this
// constant must move with it, or valid files will be rejected client-side.
const MAX_FILE_BYTES = 25 * 1024 * 1024

// Extensions the agent's private-KB extractor can actually read — see
// `agent-system/src/jarvis_agent/modules/private_kb/content.py`. Uploading
// anything outside this set would succeed on the platform (BE accepts any
// type) but yield no text for the RAG turn, so we filter at pick time.
// Kept as a Set of lowercased extensions with leading dot so lookup is O(1)
// and case matches Chrome's `File.name`. Update alongside the BE list.
const ALLOWED_EXTENSIONS: ReadonlySet<string> = new Set([
  '.pdf', '.docx',
  '.txt', '.log', '.md', '.csv', '.json',
  '.png', '.jpg', '.jpeg', '.gif', '.webp',
])

/** Machine-readable rejection reasons. Kept discriminated so a caller can
 *  route each to its own alert without string-parsing a description. */
export type ComposerRejectReason = 'too_large' | 'unsupported_type'

interface UseComposerAttachmentsOptions {
  /** Fired when `pick` filters out one or more files. Called once per
   *  reason group, so a mixed batch may fire twice. `names` lists the
   *  files that were NOT added to the attachment list. */
  onReject?: (reason: ComposerRejectReason, names: string[]) => void
}

function fileExtension(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot < 0 ? '' : name.slice(dot).toLowerCase()
}

interface UseComposerAttachmentsResult {
  attachments: ChatAttachment[]
  /** Append picked files, minting a blob URL per file. Files above the
   *  `MAX_FILE_BYTES` cap are silently dropped and reported via the
   *  hook's `onReject` option — they never become tiles. */
  pick: (list: FileList | null) => void
  /** Remove one chip and revoke its blob URL. */
  remove: (key: string) => void
  /** Clear composer state WITHOUT revoking — call after send so the
   *  URLs stay live for the message bubble that inherits them. */
  reset: () => void
  /** Overwrite the attachment list wholesale (also syncs the unmount-cleanup
   *  ref). Used by the upload orchestrator to write back post-upload states
   *  without revoking any URLs. */
  replaceAll: (next: ChatAttachment[]) => void
}

/**
 * Composer view-model for file attachments. Owns:
 *  - the picked-files array
 *  - blob URL minting (URL.createObjectURL) on pick
 *  - blob URL cleanup on remove
 *  - unmount cleanup — revokes any URLs still in state, i.e. files the
 *    user attached but never sent (sent files migrate into the store's
 *    message list and are revoked by chat-store.clear() later)
 *
 * Sits between chat-input's form state (text) and the domain store,
 * mirroring the useLogin / login-form split.
 */
export function useComposerAttachments(
  options?: UseComposerAttachmentsOptions,
): UseComposerAttachmentsResult {
  const { onReject } = options ?? {}
  const [attachments, setAttachments] = useState<ChatAttachment[]>([])

  // Keep a ref in sync so the unmount cleanup sees the latest list
  // without re-subscribing on every change.
  const ref = useRef<ChatAttachment[]>([])
  useEffect(() => {
    ref.current = attachments
  }, [attachments])
  useEffect(
    () => () => ref.current.forEach((a) => URL.revokeObjectURL(a.previewUrl)),
    [],
  )

  const pick = useCallback(
    (list: FileList | null) => {
      if (!list || list.length === 0) return
      // Split before minting blob URLs so rejected files never allocate one.
      // Type check runs first so a 60 MB `.exe` reads as "unsupported" (the
      // real problem) rather than "too large" (misleading — a 20 MB `.exe`
      // is just as unusable).
      const rejectedType: string[] = []
      const rejectedSize: string[] = []
      const accepted: File[] = []
      for (const file of Array.from(list)) {
        if (!ALLOWED_EXTENSIONS.has(fileExtension(file.name))) {
          rejectedType.push(file.name)
        } else if (file.size > MAX_FILE_BYTES) {
          rejectedSize.push(file.name)
        } else {
          accepted.push(file)
        }
      }
      if (rejectedType.length > 0) onReject?.('unsupported_type', rejectedType)
      if (rejectedSize.length > 0) onReject?.('too_large', rejectedSize)
      if (accepted.length === 0) return
      const next: ChatAttachment[] = accepted.map((file) => ({
        key: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        uploadStatus: 'pending',
      }))
      setAttachments((prev) => [...prev, ...next])
    },
    [onReject],
  )

  const remove = useCallback((key: string) => {
    setAttachments((prev) => {
      const removed = prev.find((a) => a.key === key)
      if (removed) URL.revokeObjectURL(removed.previewUrl)
      return prev.filter((a) => a.key !== key)
    })
  }, [])

  const reset = useCallback(() => {
    // Drop the ref too so unmount cleanup doesn't revoke URLs that
    // just migrated to a message.
    ref.current = []
    setAttachments([])
  }, [])

  const replaceAll = useCallback((next: ChatAttachment[]) => {
    // Sync the ref so unmount-cleanup revokes the CURRENT set, not stale ones.
    ref.current = next
    setAttachments(next)
  }, [])

  return { attachments, pick, remove, reset, replaceAll }
}
