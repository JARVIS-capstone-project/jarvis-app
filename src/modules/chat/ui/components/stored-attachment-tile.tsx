import { FileIcon, FileText, ImageIcon } from 'lucide-react'
import type { UploadedDocument } from '@modules/chat/model/types'

interface Props {
  document: UploadedDocument
  onOpenPreview?: () => void
}

/**
 * 120px tile used inside message bubbles for attachments hydrated from
 * `GET /sessions/{id}` (i.e. history — no local `File` object). Renders
 * icon + filename + size; clicking opens the preview modal, which
 * resolves via IndexedDB blob cache → BE `preview_url` fallback (same
 * as `DocumentTile` on /dev/document, just smaller).
 *
 * No live thumbnail for images/PDFs — we don't have the bytes here on
 * the hot path. The modal renders the real preview on click.
 */
export function StoredAttachmentTile({ document, onOpenPreview }: Props) {
  return (
    <button
      type="button"
      onClick={onOpenPreview}
      title={document.filename}
      aria-label={`Preview ${document.filename}`}
      className="relative flex size-30 shrink-0 flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border border-divider bg-panel p-2 text-center transition-colors hover:bg-hover"
    >
      <TileIcon contentType={document.contentType} />
      <span className="line-clamp-3 break-all text-xs font-medium text-heading">
        {document.filename}
      </span>
      <span className="pointer-events-none absolute bottom-1 left-1 rounded-md bg-scrim px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
        {typeBadge(document)}
      </span>
    </button>
  )
}

// Conditional JSX (not a dynamic component reference) — keeps the React
// compiler's static-components rule happy.
function TileIcon({ contentType }: { contentType: string }) {
  const cn = 'size-7 text-muted'
  if (contentType.startsWith('image/')) return <ImageIcon className={cn} />
  if (contentType === 'application/pdf') return <FileText className={cn} />
  return <FileIcon className={cn} />
}

function typeBadge(document: UploadedDocument): string {
  const idx = document.filename.lastIndexOf('.')
  return idx >= 0 ? document.filename.slice(idx + 1).toUpperCase() : 'FILE'
}
