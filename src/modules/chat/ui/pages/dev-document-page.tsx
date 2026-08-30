import { useEffect } from 'react'
import { kbService } from '@modules/chat/api/kb-service'
import { useDocuments, useDocumentsStore } from '@modules/chat/model/documents-store'
import { DocumentTile } from '@modules/chat/ui/components/document-tile'

/**
 * `/dev/document` — every KB upload made from this browser. Reads the
 * persisted documents-store (localStorage-backed). Click a tile → opens
 * the preview modal, which resolves URL locally first (IndexedDB) and
 * falls back to a fresh BE signed URL when needed.
 *
 * Mount-time job-status refresh: for every stored doc with a jobId, hit
 * GET /upload-jobs/{jobId} once and reconcile the local status with BE
 * truth. Not polled — a snapshot on entry, per the spec.
 */
export function DevDocumentPage() {
  const docs = useDocuments()
  const update = useDocumentsStore((s) => s.update)

  // Intentionally runs once on mount, not on every docs mutation — otherwise
  // an in-page upload from another tab would trigger a re-fetch storm.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      // Snapshot the current docs at effect start; if the list changes during
      // fetch, we don't chase the new entries here.
      const snapshot = useDocumentsStore.getState().docs
      for (const doc of snapshot) {
        if (!doc.jobId) continue
        try {
          const job = await kbService.getUploadJob(doc.jobId)
          if (cancelled) return
          if (job.status === 'FAILED' && doc.status !== 'failed') {
            update(doc.key, {
              status: 'failed',
              errorMessage: job.error ?? 'Upload failed on the server',
            })
          }
        } catch {
          // 404 = job wiped BE-side. Keep the local row so history stays.
        }
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-canvas p-6">
      <header className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-semibold text-heading">Documents</h1>
        <p className="mt-1 text-sm text-muted">
          Every file uploaded from this browser. Click a tile to preview.
        </p>
      </header>

      <main className="mx-auto mt-6 max-w-6xl">
        {docs.length === 0 ? (
          <div className="rounded-2xl border border-divider bg-panel p-8 text-center text-muted">
            No uploads yet. Attach a file in a chat and hit Send.
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {docs.map((doc) => (
              <DocumentTile key={doc.key} document={doc} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
