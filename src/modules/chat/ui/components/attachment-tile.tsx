import { X } from 'lucide-react'
import { usePdfThumbnail } from '@modules/chat/model/use-pdf-thumbnail'
import type { ChatAttachment } from '@modules/chat/model/types'
import { cn } from '@shared/lib/cn'

interface AttachmentTileProps {
  attachment: ChatAttachment
  /** When provided, an X button renders top-right and calls this. Omit
   *  inside message bubbles (post-send — nothing to remove). */
  onRemove?: () => void
}

type Kind = 'image' | 'pdf' | 'other'

/**
 * Square file tile — 120px, used in the composer (with `onRemove`) and
 * inside message bubbles (read-only). Images render inline via the blob
 * URL; PDFs render their first page via `usePdfThumbnail`; every other
 * type shows a filename + type badge. Clicking the tile opens the file
 * in a new tab.
 */
export function AttachmentTile({ attachment, onRemove }: AttachmentTileProps) {
  const kind = getKind(attachment.file)
  const ext = getExtension(attachment.file.name)

  return (
    <div
      className="relative size-30 shrink-0 overflow-hidden rounded-lg border border-divider bg-panel"
      title={attachment.file.name}
    >
      {/* Click-to-open wraps the visual — one click target for the whole tile. */}
      <a
        href={attachment.previewUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={`Open ${attachment.file.name}`}
        className="block size-full"
      >
        {kind === 'image' && <ImagePreview attachment={attachment} />}
        {kind === 'pdf' && <PdfPreview attachment={attachment} />}
        {kind === 'other' && <FilePlaceholder name={attachment.file.name} ext={ext} />}
      </a>

      {/* Preview tiles get a small scrim type badge overlay bottom-left.
          Non-preview tiles show the ext inline in FilePlaceholder instead. */}
      {kind !== 'other' && (
        <span className="pointer-events-none absolute bottom-1 left-1 rounded-md bg-scrim px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
          {ext}
        </span>
      )}

      {/* Remove sits above the anchor via later DOM order. Stop propagation
          so clicking X doesn't also trigger the anchor's navigation. */}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onRemove()
          }}
          aria-label="Remove file"
          className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-scrim text-white transition-colors hover:bg-scrim-strong"
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  )
}

function ImagePreview({ attachment }: { attachment: ChatAttachment }) {
  return (
    <img
      src={attachment.previewUrl}
      alt={attachment.file.name}
      className="size-full object-cover"
    />
  )
}

function PdfPreview({ attachment }: { attachment: ChatAttachment }) {
  const { canvasRef, status } = usePdfThumbnail(attachment.file)

  if (status === 'error') {
    return <FilePlaceholder name={attachment.file.name} ext="PDF" />
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        className={cn(
          'size-full object-cover object-top transition-opacity',
          status === 'ready' ? 'opacity-100' : 'opacity-0',
        )}
      />
      {status === 'loading' && <div className="absolute inset-0 animate-pulse bg-surface" />}
    </>
  )
}

function FilePlaceholder({ name, ext }: { name: string; ext: string }) {
  return (
    <div className="flex size-full flex-col items-center justify-between gap-2 p-2 text-center">
      <span className="line-clamp-4 break-all text-xs font-medium text-heading">{name}</span>
      <span className="rounded-md bg-surface px-2 py-1 text-[10px] font-semibold uppercase text-body">
        {ext}
      </span>
    </div>
  )
}

function getKind(file: File): Kind {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type === 'application/pdf') return 'pdf'
  return 'other'
}

function getExtension(name: string): string {
  const idx = name.lastIndexOf('.')
  return idx >= 0 ? name.slice(idx + 1).toUpperCase() : 'FILE'
}
