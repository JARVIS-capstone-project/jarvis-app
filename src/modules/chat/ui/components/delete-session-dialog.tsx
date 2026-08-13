import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { HoldToConfirm } from '@shared/ui/hold-to-confirm'

interface Props {
  open: boolean
  /** Shown in the prompt so the user can tell which row they hit. */
  sessionLabel: string
  onCancel: () => void
  onConfirm: () => void
}

/**
 * Confirmation surface for deleting a chat session. Destructive and not
 * undoable — the BE soft-deletes the row, drops the ADK session, and asks
 * Platform to remove the attachments — so the confirm is a held press rather
 * than a click. A misfire on a list row sits one pixel from a navigation
 * target, and a click cannot tell the two apart.
 *
 * Cancel is the plain button and confirm is the one that costs effort, which
 * is the intended asymmetry: the safe path should be the cheap one.
 */
export function DeleteSessionDialog({
  open,
  sessionLabel,
  onCancel,
  onConfirm,
}: Props) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-session-title"
      onClick={onCancel}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-divider bg-panel p-6"
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-danger-soft">
            <AlertTriangle className="size-5 text-danger" />
          </div>
          <div className="min-w-0">
            <h2
              id="delete-session-title"
              className="text-base font-semibold text-heading"
            >
              Delete this conversation?
            </h2>
            <p className="mt-0.5 truncate text-sm text-muted" title={sessionLabel}>
              {sessionLabel}
            </p>
          </div>
        </div>

        <p className="mb-6 text-sm leading-relaxed text-body">
          The full message history and every file uploaded to this conversation
          will be removed from the server. This cannot be undone.
        </p>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-divider px-4 py-2 text-sm font-medium text-body transition-colors hover:bg-hover hover:text-heading"
          >
            Cancel
          </button>
          <HoldToConfirm onConfirm={onConfirm} durationMs={2000}>
            Hold to delete
          </HoldToConfirm>
        </div>

        <p className="mt-3 text-right text-xs text-muted">Hold to delete</p>
      </div>
    </div>
  )
}
