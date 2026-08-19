import { cn } from '@shared/lib/cn'

/** Labelled form row, with the label in the same mono caps the panels use. */
export function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string
  hint?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <label className={cn('flex flex-col gap-1', className)}>
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
        {label}
      </span>
      {children}
      {hint && <span className="text-[11px] text-muted">{hint}</span>}
    </label>
  )
}

/**
 * A small closed set of choices, rendered inline rather than as a `<select>`
 * — two or three options each with a one-word label, where seeing all of them
 * at once is cheaper than opening a menu to discover there were only three.
 *
 * A disabled option stays *visible* on purpose: "OAuth, greyed out" tells the
 * user the capability exists and is not ready, where omitting it would read as
 * "this deployment cannot do OAuth at all".
 */
export function SegmentedChoice({
  options,
  value,
  onChange,
  disabledHint,
}: {
  options: { value: string; label: string; disabled?: boolean }[]
  value: string
  onChange: (value: string) => void
  disabledHint?: string
}) {
  return (
    <div className="flex gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={opt.disabled}
          onClick={() => onChange(opt.value)}
          title={opt.disabled ? disabledHint : undefined}
          className={cn(
            'rounded-md border px-2.5 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40',
            value === opt.value
              ? 'border-brand/50 bg-brand-glow-soft text-brand'
              : 'border-divider text-body enabled:hover:bg-hover enabled:hover:text-heading',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
