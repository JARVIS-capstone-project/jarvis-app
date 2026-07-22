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
 * Single chat bubble. Right-aligned brand-tinted for the user; left-aligned
 * neutral for the assistant.
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
  const [preview, setPreview] = useState<PreviewTarget | null>(null)

  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'flex max-w-[80%] flex-col gap-2 rounded-2xl px-4 py-3 text-sm',
          isUser ? 'bg-brand text-white' : 'border border-divider bg-surface text-heading',
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
          ) : (
            // Assistant response — agent-system emits markdown; render it
            // with token-styled elements. Safe from LLM prompt injection:
            // react-markdown does not render raw HTML by default.
            <Markdown content={message.content} className="wrap-break-word" />
          )
        ) : (
          // Empty assistant bubble while stream is live — shown between
          // `turn_start` and the first `text_delta`. Once a delta lands,
          // `hasText` flips true and this branch is replaced.
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
