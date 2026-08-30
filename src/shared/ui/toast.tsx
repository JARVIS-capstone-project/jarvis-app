import { useEffect } from 'react'
import { AlertTriangle, Check } from 'lucide-react'
import {
  TOAST_MS,
  useToastStore,
  type Toast,
} from '@shared/model/toast-store'
import { cn } from '@shared/lib/cn'

/**
 * Renders the live toasts. Mount once, at the app shell — and outside the
 * router, since an action that navigates (deleting the open session) still
 * has to report its own outcome after the page has changed under it.
 */
export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts)

  return (
    <div
      // `pointer-events-none` on the stack, re-enabled per toast: the empty
      // column spans the viewport width and would otherwise eat clicks.
      className="pointer-events-none fixed bottom-4 left-1/2 z-60 flex w-full max-w-md -translate-x-1/2 flex-col items-center gap-2 px-4"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  )
}

function ToastItem({ toast: t }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss)

  useEffect(() => {
    const timer = setTimeout(() => dismiss(t.id), TOAST_MS)
    return () => clearTimeout(timer)
  }, [t.id, dismiss])

  const Icon = t.variant === 'danger' ? AlertTriangle : Check

  return (
    <div
      onClick={() => dismiss(t.id)}
      className={cn(
        'pointer-events-auto flex w-full cursor-pointer items-center gap-2.5 rounded-lg border px-3.5 py-2.5',
        'text-sm shadow-lg',
        t.variant === 'danger'
          ? 'border-danger/40 bg-danger-soft text-danger'
          : 'border-divider bg-panel text-heading',
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="min-w-0 flex-1">{t.message}</span>
    </div>
  )
}
