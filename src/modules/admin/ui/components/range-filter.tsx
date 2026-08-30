import { cn } from '@shared/lib/cn'

/**
 * The today / 7d / 30d window picker both agent summaries take.
 *
 * One row, above the charts, never inside them — a control that moves with
 * the data it filters reads as part of the reading, and the same window
 * applies to every panel on the page.
 */
const LABELS: Record<string, string> = {
  today: 'Today',
  '7d': '7 days',
  '30d': '30 days',
}

export function RangeFilter<T extends string>({
  options,
  value,
  onChange,
  disabled,
  className,
}: {
  options: readonly T[]
  value: T
  onChange: (value: T) => void
  disabled?: boolean
  className?: string
}) {
  return (
    <div
      role="group"
      aria-label="Time range"
      className={cn(
        'flex shrink-0 overflow-hidden rounded-md border border-divider',
        className,
      )}
    >
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          disabled={disabled}
          aria-pressed={value === opt}
          onClick={() => onChange(opt)}
          className={cn(
            'px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-50',
            value === opt
              ? 'bg-brand-glow-soft text-brand'
              : 'text-muted enabled:hover:bg-hover enabled:hover:text-heading',
          )}
        >
          {LABELS[opt] ?? opt}
        </button>
      ))}
    </div>
  )
}
