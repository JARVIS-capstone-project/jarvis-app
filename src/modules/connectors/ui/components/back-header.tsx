import { ArrowLeft } from 'lucide-react'

/**
 * Title row for any view pushed on top of the connections list. The settings
 * pane is one column with no chrome of its own, so this arrow is the only
 * way back — every non-root view must render it.
 */
export function BackHeader({
  onBack,
  children,
}: {
  onBack: () => void
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-hover hover:text-heading"
      >
        <ArrowLeft className="size-4" />
      </button>
      <h3 className="min-w-0 truncate font-display text-sm uppercase tracking-widest text-heading">
        {children}
      </h3>
    </div>
  )
}
