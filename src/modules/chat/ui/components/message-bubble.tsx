import { useState } from 'react'
import { AttachmentPreviewModal } from '@modules/chat/ui/components/attachment-preview-modal'
import { AttachmentTile } from '@modules/chat/ui/components/attachment-tile'
import type { PreviewTarget } from '@modules/chat/model/use-document-preview'
import { cn } from '@shared/lib/cn'
import type { ChatMessage } from '@modules/chat/model/types'

interface MessageBubbleProps {
  message: ChatMessage
}

/**
 * Single chat bubble. Right-aligned brand-tinted for the user; left-aligned
 * neutral for the assistant. Renders any attachments above the text — chips
 * stay read-only in the bubble (no remove; use `AttachmentChip` without
 * `onRemove`). Text is pre-wrapped plaintext; markdown/rich formatting is
 * a follow-up ticket.
 */
export function MessageBubble({ message }: MessageBubbleProps) {
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
            {message.attachments!.map((a) => (
              <AttachmentTile
                key={a.key}
                attachment={a}
                onOpenPreview={() => setPreview({ kind: 'live', attachment: a })}
              />
            ))}
          </div>
        )}
        {hasText && <div className="whitespace-pre-wrap wrap-break-word">{message.content}</div>}
      </div>
      {preview && (
        <AttachmentPreviewModal target={preview} onClose={() => setPreview(null)} />
      )}
    </div>
  )
}
