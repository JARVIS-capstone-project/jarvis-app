import { useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { ArrowUp, AudioLines, Plus } from 'lucide-react'
import { AttachmentTile } from '@modules/chat/ui/components/attachment-tile'
import { useComposerAttachments } from '@modules/chat/model/use-composer-attachments'
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
  const { attachments, pick, remove, reset } = useComposerAttachments()
  const taRef = useRef<HTMLTextAreaElement>(null)

  // Resize the textarea to fit content on every value change. Height is
  // reset to auto first so shrinking (after send/delete) works too.
  useLayoutEffect(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  const canSend = (value.trim().length > 0 || attachments.length > 0) && !disabled

  const submit = () => {
    if (!canSend) return
    onSend(value.trim(), attachments.length > 0 ? attachments : undefined)
    setValue('')
    // reset() clears state WITHOUT revoking — the URLs now live on the
    // message the store just appended.
    reset()
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
                />
              ))}
            </div>
          )}
          <textarea
            ref={taRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Anything....."
            rows={1}
            aria-label="Message"
            className={cn(
              'block max-h-40 w-full resize-none overflow-y-auto bg-transparent px-1 py-1.5',
              'text-sm text-heading placeholder:text-muted',
              'focus:outline-none',
            )}
          />
          <div className="mt-2 flex items-center justify-between">
            <label
              title="Attach files"
              className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-divider bg-surface text-body transition-colors hover:bg-hover hover:text-heading"
            >
              <input
                type="file"
                multiple
                aria-label="Attach files"
                className="sr-only"
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
                aria-label="Send message"
                className={cn(
                  'flex size-9 items-center justify-center rounded-lg transition-colors',
                  canSend
                    ? 'bg-brand text-white hover:bg-brand-hover'
                    : 'cursor-not-allowed bg-surface text-muted',
                )}
              >
                <ArrowUp className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
