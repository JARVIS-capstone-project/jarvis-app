import { cn } from '@shared/lib/cn'

/**
 * Big status dot with soft glow — reads like a rack-mount server LED. Two
 * states only: `ok` (green) or `degraded` (red). Unknown / unreachable also
 * counts as `degraded` — a dark light is the safest signal.
 *
 * The pulse honors prefers-reduced-motion via the shared `hud-pulse` class.
 */
export type HealthState = 'ok' | 'degraded'

interface Props {
  state: HealthState
  label?: string
  /** Small caption under the light (e.g. "checked 4s ago"). */
  hint?: string
  className?: string
}

export function HealthLight({ state, label, hint, className }: Props) {
  const isOk = state === 'ok'
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div className="relative flex size-14 items-center justify-center">
        <span
          aria-hidden
          className={cn(
            'absolute inset-0 rounded-full opacity-40 blur-md hud-pulse',
            isOk ? 'bg-success' : 'bg-danger',
          )}
        />
        <span
          className={cn(
            'relative size-8 rounded-full border-2 shadow-inner',
            isOk
              ? 'border-success/50 bg-success shadow-success/40'
              : 'border-danger/50 bg-danger shadow-danger/40',
          )}
        />
      </div>
      <div className="min-w-0">
        <div
          className={cn(
            'font-display text-lg uppercase tracking-widest',
            isOk ? 'text-success' : 'text-danger',
          )}
        >
          {label ?? (isOk ? 'Operational' : 'Degraded')}
        </div>
        {hint && (
          <div className="font-mono text-xs text-muted">{hint}</div>
        )}
      </div>
    </div>
  )
}
