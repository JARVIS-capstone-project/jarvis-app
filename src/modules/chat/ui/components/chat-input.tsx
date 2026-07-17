import { useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { ArrowUp, AudioLines, Loader2, Plus } from 'lucide-react'
import { AttachmentPreviewModal } from '@modules/chat/ui/components/attachment-preview-modal'
import { AttachmentTile } from '@modules/chat/ui/components/attachment-tile'
import { useComposerAttachments } from '@modules/chat/model/use-composer-attachments'
import type { PreviewTarget } from '@modules/chat/model/use-document-preview'
import { useUploadDocuments } from '@modules/chat/model/use-upload-documents'
import type { ChatAttachment } from '@modules/chat/model/types'
import { cn } from '@shared/lib/cn'

interface ChatInputProps {
  onSend: (content: string, attachments?: ChatAttachment[]) => void
  disabled?: boolean
}

/**
 * Composer for the chat section. Enter submits, Shift+Enter inserts a
 * newline; the textarea auto-grows up to a capped height, then scrolls.
 *
 * Text is local (form state). Attachment state + blob URL lifecycle lives
 * in useComposerAttachments — this component just wires pick/remove/reset.
 * Send takes either text or files (or both); files migrate into the
 * created message and remain openable there. Voice is a placeholder.
 */
export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState<PreviewTarget | null>(null)
  const { attachments, pick, remove, reset, replaceAll } = useComposerAttachments()
  const upload = useUploadDocuments()
  const taRef = useRef<HTMLTextAreaElement>(null)

  // Resize the textarea to fit content on every value change. Height is
  // reset to auto first so shrinking (after send/delete) works too.
  useLayoutEffect(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  const canSend = (value.trim().length > 0 || attachments.length > 0) && !disabled && !busy

  const submit = async () => {
    if (!canSend) return

    // Fast path: no files → instant send, no upload machinery.
    if (attachments.length === 0) {
      onSend(value.trim())
      setValue('')
      return
    }

    // Blocking upload flow: fire N parallel POSTs, await all, then decide.
    setBusy(true)
    // Flip pending → uploading so each tile shows the spinner overlay while
    // the request is in flight. Already-uploaded (retry) tiles keep 'done'.
    const uploading = attachments.map((a) =>
      a.sourceId ? a : { ...a, uploadStatus: 'uploading' as const },
    )
    replaceAll(uploading)
    try {
      const updated = await upload(uploading)
      const anyFailed = updated.some((a) => a.uploadStatus === 'failed')
      if (anyFailed) {
        // Reflect statuses in composer so tiles show failed / done correctly.
        // Do NOT send the message — user retries after seeing the failures.
        replaceAll(updated)
        return
      }
      // All done → commit message with the enriched attachments (now carry
      // sourceId + jobId) and clear composer. reset() drops state WITHOUT
      // revoking blob URLs — the message bubble inherits them.
      onSend(value.trim(), updated)
      setValue('')
      reset()
    } finally {
      setBusy(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="px-6 pb-4 pt-2">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl bg-surface p-3">
          {attachments.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachments.map((a) => (
                <AttachmentTile
                  key={a.key}
                  attachment={a}
                  onRemove={() => remove(a.key)}
                  onOpenPreview={() => setPreview({ kind: 'live', attachment: a })}
                />
              ))}
            </div>
          )}
          <textarea
            ref={taRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={busy ? 'Uploading…' : 'Ask Anything.....'}
            rows={1}
            aria-label="Message"
            disabled={busy}
            className={cn(
              'block max-h-40 w-full resize-none overflow-y-auto bg-transparent px-1 py-1.5',
              'text-sm text-heading placeholder:text-muted',
              'focus:outline-none disabled:cursor-not-allowed',
            )}
          />
          <div className="mt-2 flex items-center justify-between">
            <label
              title="Attach files"
              className={cn(
                'flex size-9 items-center justify-center rounded-lg border border-divider bg-surface text-body transition-colors',
                busy
                  ? 'cursor-not-allowed opacity-50'
                  : 'cursor-pointer hover:bg-hover hover:text-heading',
              )}
            >
              <input
                type="file"
                multiple
                aria-label="Attach files"
                className="sr-only"
                disabled={busy}
                onChange={(e) => {
                  pick(e.target.files)
                  // Reset so re-picking the same file still fires change.
                  e.target.value = ''
                }}
              />
              <Plus className="size-4" />
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Voice input (coming soon)"
                title="Voice — coming soon"
                className="flex size-9 items-center justify-center rounded-lg border border-divider bg-surface text-body transition-colors hover:bg-hover"
              >
                <AudioLines className="size-4" />
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={!canSend}
                aria-label={busy ? 'Uploading' : 'Send message'}
                aria-busy={busy}
                className={cn(
                  'flex size-9 items-center justify-center rounded-lg transition-colors',
                  canSend
                    ? 'bg-brand text-white hover:bg-brand-hover'
                    : busy
                      ? 'bg-brand text-white'
                      : 'cursor-not-allowed bg-surface text-muted',
                )}
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ArrowUp className="size-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      {preview && (
        <AttachmentPreviewModal target={preview} onClose={() => setPreview(null)} />
      )}
    </div>
  )
}
