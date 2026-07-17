import { useState } from 'react'
import { AlertCircle, Clock, FileIcon, ImageIcon, FileText } from 'lucide-react'
import { AttachmentPreviewModal } from '@modules/chat/ui/components/attachment-preview-modal'
import type { UploadedDocument } from '@modules/chat/model/types'

interface Props {
  document: UploadedDocument
}

/**
 * Tile used in /dev/document. Larger (180px square) than the composer tile.
 * Reads UploadedDocument (persisted metadata) instead of a live ChatAttachment.
 *
 * Failed uploads are non-interactive (nothing to preview). Successful tiles
 * open the preview modal — the modal itself resolves the URL from the local
 * blob cache first, falling back to the BE signed URL only if the cache
 * misses (e.g. cross-browser, storage cleared).
 *
 * Expired badge shows when metadata's `fileExpiresAt` has passed. Per plan
 * policy the tile is STILL clickable when expired — local IndexedDB cache
 * may still hold the bytes.
 */
export function DocumentTile({ document }: Props) {
  const [open, setOpen] = useState(false)
  // Snapshot 'now' at mount so the render is pure. Acceptable: expiry
  // state doesn't need to tick live on this page (it's a dev tool).
  const [mountedAt] = useState(() => Date.now())
  const isFailed = document.status === 'failed'
  const isExpired = Boolean(
    document.fileExpiresAt && new Date(document.fileExpiresAt).getTime() < mountedAt,
  )

  return (
    <>
      <button
        type="button"
        onClick={() => !isFailed && setOpen(true)}
        disabled={isFailed}
        title={isFailed ? document.errorMessage ?? document.filename : document.filename}
        className="relative size-45 shrink-0 overflow-hidden rounded-lg border border-divider bg-panel text-left transition-opacity disabled:cursor-not-allowed"
      >
        <TileBody document={document} />

        {/* Persistent type badge, bottom-left. */}
        <span className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-scrim px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
          {typeBadge(document)}
        </span>

        {/* Expired badge — visible for any doc past its TTL, even if local
            cache still works. Warning color to distinguish from failure. */}
        {isExpired && !isFailed && (
          <span className="pointer-events-none absolute left-2 top-2 flex items-center gap-1 rounded-md bg-scrim px-2 py-0.5 text-[10px] font-semibold uppercase text-warning">
            <Clock className="size-3" /> Expired
          </span>
        )}

        {/* Failed overlay covers the whole tile — signals non-clickable. */}
        {isFailed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-scrim">
            <AlertCircle className="size-8 text-danger" />
            <span className="text-xs font-semibold uppercase tracking-wider text-white">
              Failed
            </span>
          </div>
        )}
      </button>

      {open && (
        <AttachmentPreviewModal
          target={{ kind: 'stored', document }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

/**
 * Static body of the tile — filename + generic type icon. No live preview
 * (image/PDF thumbnails require the actual bytes, which live in IndexedDB
 * or need a BE call — we don't fetch on list render). The MODAL renders
 * the real preview when the tile is clicked.
 */
function TileBody({ document }: { document: UploadedDocument }) {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-3 p-3 text-center">
      <TileIcon contentType={document.contentType} />
      <span className="line-clamp-3 break-all text-xs font-medium text-heading">
        {document.filename}
      </span>
      <span className="text-[10px] text-muted">{formatBytes(document.sizeBytes)}</span>
    </div>
  )
}

// Conditional JSX (not a dynamic component reference) — keeps React
// compiler's static-components rule happy.
function TileIcon({ contentType }: { contentType: string }) {
  const cn = 'size-10 text-muted'
  if (contentType.startsWith('image/')) return <ImageIcon className={cn} />
  if (contentType === 'application/pdf') return <FileText className={cn} />
  return <FileIcon className={cn} />
}

function typeBadge(document: UploadedDocument): string {
  const idx = document.filename.lastIndexOf('.')
  return idx >= 0 ? document.filename.slice(idx + 1).toUpperCase() : 'FILE'
}

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}
