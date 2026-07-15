import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChatAttachment } from '@modules/chat/model/types'

interface UseComposerAttachmentsResult {
  attachments: ChatAttachment[]
  /** Append picked files, minting a blob URL per file. */
  pick: (list: FileList | null) => void
  /** Remove one chip and revoke its blob URL. */
  remove: (key: string) => void
  /** Clear composer state WITHOUT revoking — call after send so the
   *  URLs stay live for the message bubble that inherits them. */
  reset: () => void
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
export function useComposerAttachments(): UseComposerAttachmentsResult {
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

  const pick = useCallback((list: FileList | null) => {
    if (!list || list.length === 0) return
    const next: ChatAttachment[] = Array.from(list).map((file) => ({
      key: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }))
    setAttachments((prev) => [...prev, ...next])
  }, [])

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

  return { attachments, pick, remove, reset }
}
