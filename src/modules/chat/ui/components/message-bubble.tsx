import { useState } from 'react'
import { AttachmentPreviewModal } from '@modules/chat/ui/components/attachment-preview-modal'
import { AttachmentTile } from '@modules/chat/ui/components/attachment-tile'
import { StoredAttachmentTile } from '@modules/chat/ui/components/stored-attachment-tile'
import type { PreviewTarget } from '@modules/chat/model/use-document-preview'
import { cn } from '@shared/lib/cn'
import { Markdown } from '@shared/ui/markdown'
import type {
  ChatAttachment,
  ChatMessage,
  UploadedDocument,
} from '@modules/chat/model/types'

interface MessageBubbleProps {
  message: ChatMessage
  /** True when this is the last assistant bubble AND the stream is open AND
   *  no `text_delta` has landed yet. Renders a "Thinking..." indicator in
   *  place of the (empty) text. Hides as soon as `content` is non-empty. */
  isThinking?: boolean
}

/**
 * Single chat bubble.
 *
 * USER — right-aligned brand-tinted rounded bubble, capped at 80% width so
 *        long lines don't run to the panel edge.
 *
 * ASSISTANT — no bubble, no background, no padding. Renders as flush
 *        markdown/text on the panel background, left-aligned, spanning the
 *        full parent column (its right edge lines up with the user bubble's).
 *        This matches the screenshot: an answer that "belongs" to the page,
 *        not to a container.
 *
 * Attachments come in two flavours per message. Live ones (this session,
 * carry `file`) render via `AttachmentTile` and preview from the in-memory
 * blob URL. Hydrated ones (from `GET /sessions/{id}`, no `file`) render via
 * `StoredAttachmentTile` and preview via IndexedDB → BE signed URL.
 *
 * Discriminator: `'file' in a` — present only on `ChatAttachment`.
 */
export function MessageBubble({ message, isThinking = false }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const hasAttachments = Boolean(message.attachments && message.attachments.length > 0)
  const hasText = message.content.length > 0
  const hasThinking = !isUser && !hasText && Boolean(message.thinking)
  const [preview, setPreview] = useState<PreviewTarget | null>(null)

  return (
    <div className={cn('flex w-full', isUser && 'justify-end')}>
      <div
        className={cn(
          'flex flex-col gap-2 text-sm',
          isUser
            ? 'max-w-[80%] rounded-2xl bg-brand px-4 py-3 text-white'
            : 'w-full text-heading',
        )}
      >
        {hasAttachments && (
          <div className="flex flex-wrap gap-2">
            {message.attachments!.map((a) =>
              isLive(a) ? (
                <AttachmentTile
                  key={a.key}
                  attachment={a}
                  onOpenPreview={() =>
                    setPreview({ kind: 'live', attachment: a })
                  }
                />
              ) : (
                <StoredAttachmentTile
                  key={a.key}
                  document={a}
                  onOpenPreview={() => setPreview({ kind: 'stored', document: a })}
                />
              ),
            )}
          </div>
        )}
        {hasText ? (
          isUser ? (
            // User-typed text — plaintext (never reformat what they entered).
            <div className="whitespace-pre-wrap wrap-break-word">
              {message.content}
            </div>
          ) : message.interrupted ? (
            // Synthetic "The process was interrupted." marker — client-only
            // status label written by useHydrateSession when the persisted
            // tail is a bare user message. Dim + italic so it reads as a
            // notice, not an answer. The Retry action lives in the composer
            // banner above (see chat-input.tsx isInterrupted branch).
            <div className="italic text-muted wrap-break-word">
              {message.content}
            </div>
          ) : (
            // Assistant response — agent-system emits markdown; render it
            // with token-styled elements. Safe from LLM prompt injection:
            // react-markdown does not render raw HTML by default.
            <Markdown content={message.content} className="wrap-break-word" />
          )
        ) : hasThinking ? (
          // Rolling reasoning step — verbatim `thinking_delta` from Gemini.
          // Rendered as markdown so bolded titles look clean, muted-italic
          // to read as "reasoning" not "answer". Replaced every 0.8s by the
          // ThinkingQueue drain; disappears the moment the first `text_delta`
          // lands (patchLastAssistant clears `thinking`).
          <Markdown
            content={message.thinking!}
            className="wrap-break-word italic text-body opacity-80"
          />
        ) : (
          // Pre-first-delta gap — between `turn_start` and either the first
          // `thinking_delta` or the first `text_delta`.
          isThinking && <ThinkingIndicator />
        )}
      </div>
      {preview && (
        <AttachmentPreviewModal target={preview} onClose={() => setPreview(null)} />
      )}
    </div>
  )
}

function isLive(a: ChatAttachment | UploadedDocument): a is ChatAttachment {
  return 'file' in a
}

// "Thinking" label + three dots pulsing on a staggered delay. Uses the same
// `bg-body` token as body text so it stays theme-consistent, and inline
// animation delays because Tailwind has no built-in stagger utility.
function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2 text-body">
      <span className="italic">Thinking</span>
      <span className="flex items-center gap-1">
        <span className="size-1.5 animate-pulse rounded-full bg-body" />
        <span
          className="size-1.5 animate-pulse rounded-full bg-body"
          style={{ animationDelay: '150ms' }}
        />
        <span
          className="size-1.5 animate-pulse rounded-full bg-body"
          style={{ animationDelay: '300ms' }}
        />
      </span>
    </div>
  )
}
