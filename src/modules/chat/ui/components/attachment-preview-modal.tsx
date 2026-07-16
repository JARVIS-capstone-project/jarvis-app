import { useEffect } from 'react'
import { X } from 'lucide-react'
import {
  useDocumentPreview,
  type PreviewStatus,
  type PreviewTarget,
} from '@modules/chat/model/use-document-preview'

interface Props {
  target: PreviewTarget
  onClose: () => void
}

/**
 * Full-screen modal preview. Fetches the best-available URL for `target`
 * via `useDocumentPreview` (live blob → IndexedDB → BE signed URL). Signed
 * URLs, when fetched, live only in this component's state — unmounting
 * (close) drops them; they're never persisted.
 *
 * Close via X button, backdrop click, or Escape key.
 */
export function AttachmentPreviewModal({ target, onClose }: Props) {
  const { url, status, filename, contentType } = useDocumentPreview(target)

  // Escape closes. Attached at window level — modal is app-scoped chrome.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-scrim p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={filename}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-divider px-4 py-3">
          <h3 className="truncate text-sm font-medium text-heading" title={filename}>
            {filename || 'Preview'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="flex size-8 items-center justify-center rounded-md text-body transition-colors hover:bg-hover hover:text-heading"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="flex flex-1 items-center justify-center overflow-auto bg-canvas p-4">
          <PreviewContent url={url} status={status} contentType={contentType} filename={filename} />
        </div>
      </div>
    </div>
  )
}

function PreviewContent({
  url,
  status,
  contentType,
  filename,
}: {
  url: string | null
  status: PreviewStatus
  contentType: string
  filename: string
}) {
  if (status === 'loading') return <div className="text-sm text-muted">Loading preview…</div>
  if (status === 'expired')
    return (
      <div className="text-sm text-muted">
        This file has expired. Only stored briefly on the server.
      </div>
    )
  if (status === 'error' || !url)
    return <div className="text-sm text-muted">Unable to preview {filename || 'this file'}.</div>

  if (contentType.startsWith('image/')) {
    return (
      <img src={url} alt={filename} className="max-h-full max-w-full object-contain" />
    )
  }
  if (contentType === 'application/pdf') {
    // <iframe> is more reliable than <embed> for blob: URLs — some Chrome
    // versions silently download an <embed>'d blob PDF. iframe routes
    // through the browser's built-in PDF viewer consistently.
    //
    // Post-cache-clear scenario: if this URL is a BE signed URL, GCS
    // returns Content-Disposition: attachment (inherited from the stored
    // object). The browser will download regardless of iframe/embed —
    // that's a BE fix (sign with response-content-disposition=inline OR
    // upload with inline disposition).
    return (
      <iframe
        src={url}
        title={filename || 'PDF preview'}
        className="h-[80vh] w-full border-none bg-white"
      />
    )
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="text-sm text-brand underline transition-colors hover:text-brand-hover"
    >
      Open {filename || 'file'}
    </a>
  )
}
