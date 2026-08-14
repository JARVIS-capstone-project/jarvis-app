import { useState } from 'react'
import { LifeBuoy } from 'lucide-react'
import { AttachmentPreviewModal } from '@modules/chat/ui/components/attachment-preview-modal'
import { AttachmentTile } from '@modules/chat/ui/components/attachment-tile'
import { CitationList } from '@modules/chat/ui/components/citation-list'
import { StoredAttachmentTile } from '@modules/chat/ui/components/stored-attachment-tile'
import type { PreviewTarget } from '@modules/chat/model/use-document-preview'
import { cn } from '@shared/lib/cn'
import { Markdown } from '@shared/ui/markdown'
import type {
  ChatAttachment,
  ChatMessage,
  StatusLine,
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
  const hasStatus = !isUser && !hasText && Boolean(message.status)
  const [preview, setPreview] = useState<PreviewTarget | null>(null)
  // Response-time caption above the bubble. Assistant messages only; skipped
  // on the synthetic "The process was interrupted." marker (no real turn
  // happened). Populated by hydration (`turn.response_time_ms`) and by the
  // live path when `turn_end` lands.
  const showResponseTime =
    !isUser &&
    !message.interrupted &&
    typeof message.responseTimeMs === 'number'
  // Per-message escalation chip. Persists on THIS bubble even after the
  // global ChatAlert is dismissed / cleared by a later turn — the tag
  // belongs to this specific turn, not the current agent state.
  const showEscalationChip =
    !isUser && !message.interrupted && message.requiresEscalation === true

  return (
    <div className={cn('flex w-full flex-col', isUser && 'items-end')}>
      {(showResponseTime || showEscalationChip) && (
        <div className="mb-1 flex items-center gap-2">
          {showResponseTime && (
            <p className="text-xs text-muted">
              Answered in {(message.responseTimeMs! / 1000).toFixed(1)}s
            </p>
          )}
          {showEscalationChip && (
            <span className="inline-flex items-center gap-1 rounded-full border border-warning bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning">
              <LifeBuoy className="size-3" />
              Human escalation
            </span>
          )}
        </div>
      )}
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
        ) : hasStatus ? (
          // Rolling status step — the model's reasoning, or the faithfulness
          // gate's progress. Paced by `StatusQueue` at one line per 0.8s.
          <StatusLineView line={message.status!} />
        ) : (
          // Pre-first-delta gap — between `turn_start` and either the first
          // `thinking_delta` or the first `text_delta`.
          isThinking && <ThinkingIndicator />
        )}
      </div>
      {/* Sources this answer rests on. Below the content so it reads as a
          footnote, and appended rather than inserted so the arrival of
          `turn_end` does not shift the text the user is already reading. */}
      {!isUser && !message.interrupted && message.citationRefs?.length ? (
        <CitationList refs={message.citationRefs} />
      ) : null}
      {preview && (
        <AttachmentPreviewModal target={preview} onClose={() => setPreview(null)} />
      )}
    </div>
  )
}

function isLive(a: ChatAttachment | UploadedDocument): a is ChatAttachment {
  return 'file' in a
}

// Extracts the last `**Heading**` from a streaming thinking buffer and shows
// it as a compact italic label. Falls back to "Thinking…" when the buffer
// hasn't produced a complete heading yet.
/**
 * One line of the pre-answer status pane.
 *
 * Every kind arrives display-ready — `StatusStream` has already reduced the
 * reasoning stream to its heading — so this only picks the tone. Rendered as
 * text, never markdown: the judge's `reason` is prose written about untrusted
 * source material and gets no richer treatment than a sentence.
 */
function StatusLineView({ line }: { line: StatusLine }) {
  return (
    <div
      className={cn(
        'italic wrap-break-word',
        // A judge that could not run is not a verdict about the answer, and
        // must not be able to read as one.
        line.kind === 'validation-error'
          ? 'text-warning'
          : 'text-body opacity-80',
      )}
    >
      {line.text}
    </div>
  )
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
