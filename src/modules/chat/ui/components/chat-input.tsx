import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { useParams } from 'react-router'
import { ArrowUp, AudioLines, Loader2, Plus, RotateCw } from 'lucide-react'
import { AttachmentPreviewModal } from '@modules/chat/ui/components/attachment-preview-modal'
import { AttachmentTile } from '@modules/chat/ui/components/attachment-tile'
import { useComposerAttachments } from '@modules/chat/model/use-composer-attachments'
import {
  PRE_SESSION_KEY,
  useChatSession,
  useChatSessionStore,
} from '@modules/chat/model/chat-session-store'
import { useChatSend } from '@modules/chat/model/use-chat-send'
import type { PreviewTarget } from '@modules/chat/model/use-document-preview'
import { cn } from '@shared/lib/cn'

interface ChatInputProps {
  disabled?: boolean
}

/**
 * Composer for the chat section. Enter submits, Shift+Enter inserts a
 * newline; the textarea auto-grows up to a capped height, then scrolls.
 *
 * Owns text (form state) + attachment picking. All send/upload/stream
 * plumbing lives in `useChatSend`. On any pipeline failure the composer
 * restores from `chat-session-store.pendingPayload` and surfaces the
 * "Error happened please try again" banner above itself.
 */
export function ChatInput({ disabled }: ChatInputProps) {
  const { sessionId } = useParams<{ sessionId?: string }>()
  // Pre-session errors park on a placeholder key — see chat-session-store.
  const stateKey = sessionId ?? PRE_SESSION_KEY
  const session = useChatSession(stateKey)

  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [resuming, setResuming] = useState(false)
  const [preview, setPreview] = useState<PreviewTarget | null>(null)
  const { attachments, pick, remove, reset, replaceAll } = useComposerAttachments()
  const { send, resume } = useChatSend()
  const taRef = useRef<HTMLTextAreaElement>(null)

  // Interrupted-turn detection: after hydration on refresh, if the last
  // message is a user message with no assistant follow-up, the previous
  // stream was cut off (page refresh / tab close). `useHydrateSession`
  // ALSO appends a synthetic dim "The process was interrupted." assistant
  // marker in that same state, so we treat either tail (a bare user OR
  // the synthetic assistant) as "still interrupted" — the Retry banner
  // must stay visible whichever one is on the end.
  const lastMessage = session.messages[session.messages.length - 1]
  const isInterrupted = Boolean(
    sessionId &&
      !session.streaming &&
      !session.hydrating &&
      (lastMessage?.role === 'user' || lastMessage?.interrupted === true),
  )

  // Resize the textarea to fit content on every value change. Height is
  // reset to auto first so shrinking (after send/delete) works too.
  useLayoutEffect(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  // RESTORE: subscribe to the store so a fresh `pendingPayload` drops back
  // into the composer. Runs in a subscription callback (not directly in the
  // effect body) — this is the "sync from external system" pattern React
  // compiler's set-state-in-effect rule condones. Payload is nulled out
  // immediately after restore so the callback doesn't re-fire on unrelated
  // store updates. `errorBanner` is left alone — it stays visible until the
  // NEXT successful Send clears it (see useChatSend).
  useEffect(() => {
    return useChatSessionStore.subscribe((state) => {
      const cur = state.byId[stateKey]
      if (!cur?.pendingPayload) return
      setValue(cur.pendingPayload.text)
      replaceAll(cur.pendingPayload.attachments)
      useChatSessionStore.getState().setError(stateKey, cur.errorBanner, null)
    })
  }, [stateKey, replaceAll])

  const canSend =
    (value.trim().length > 0 || attachments.length > 0) && !disabled && !busy

  const submit = async () => {
    if (!canSend) return
    setBusy(true)
    // Capture BEFORE clearing so useChatSend still sees the payload — then
    // clear the composer IMMEDIATELY so pressing Send visibly commits the
    // message instead of letting the text sit in the input while the pre-
    // stream work (uploads, /sessions) runs. On failure, useChatSend's
    // pendingPayload → the store subscribe above refills the composer.
    const capturedText = value.trim()
    const capturedAttachments = attachments
    setValue('')
    reset()
    try {
      await send({ text: capturedText, attachments: capturedAttachments })
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
        {session.errorBanner && (
          <div
            role="alert"
            className="mb-2 rounded-md border border-danger bg-danger/10 px-3 py-2 text-sm text-danger"
          >
            {session.errorBanner}
          </div>
        )}
        {isInterrupted && !session.errorBanner && sessionId && (
          <div
            role="alert"
            className="mb-2 flex items-center justify-between gap-3 rounded-md border border-warning bg-warning/10 px-3 py-2 text-sm text-warning"
          >
            <span>Previous response was interrupted.</span>
            <button
              type="button"
              onClick={async () => {
                if (resuming) return
                setResuming(true)
                try {
                  await resume(sessionId)
                } finally {
                  setResuming(false)
                }
              }}
              disabled={resuming}
              className="inline-flex items-center gap-1.5 rounded-md border border-warning/50 px-2 py-1 text-xs font-medium transition-colors hover:bg-warning/20 disabled:cursor-wait"
            >
              {resuming ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <RotateCw className="size-3" />
              )}
              Retry
            </button>
          </div>
        )}
        <div className="rounded-2xl bg-surface p-3">
          {attachments.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachments.map((a) => (
                <AttachmentTile
                  key={a.key}
                  attachment={a}
                  onRemove={() => remove(a.key)}
                  onOpenPreview={() =>
                    setPreview({ kind: 'live', attachment: a })
                  }
                />
              ))}
            </div>
          )}
          <textarea
            ref={taRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={busy ? 'Sending…' : 'Ask Anything.....'}
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
                aria-label={busy ? 'Sending' : 'Send message'}
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
