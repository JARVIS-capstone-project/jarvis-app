import { cn } from '@shared/lib/cn'

/**
 * Web port of AppKit's NSLevelIndicator. Two styles map to the AppKit ones:
 *   - `continuousCapacity`: smooth fill bar (like a battery meter)
 *   - `discreteCapacity`:   N segments (like a signal-strength meter)
 *
 * Fill color follows `warningValue` + `criticalValue` — whichever zone the
 * value currently sits in decides the whole fill color (no gradient). This
 * matches AppKit's behavior: cross the threshold, the fill flips.
 *
 * `direction`:
 *   - `'above'`: value >= criticalValue → critical (SEVERITY case; high = bad)
 *   - `'below'`: value <= criticalValue → critical (CONFIDENCE case; low = bad)
 *
 * Colors resolve to J.A.R.V.I.S CSS tokens (`success`, `warning`, `danger`).
 */
export type LevelStyle = 'continuousCapacity' | 'discreteCapacity'

interface Props {
  value: number
  max: number
  min?: number
  warningValue?: number
  criticalValue?: number
  direction?: 'above' | 'below'
  style?: LevelStyle
  /** For discreteCapacity, number of segments. Defaults to max-min. */
  segments?: number
  label?: string
  showValue?: boolean
  formatValue?: (v: number) => string
  className?: string
}

type Zone = 'nominal' | 'warning' | 'critical'

function zoneOf(
  value: number,
  warningValue: number | undefined,
  criticalValue: number | undefined,
  direction: 'above' | 'below',
): Zone {
  if (direction === 'above') {
    if (criticalValue !== undefined && value >= criticalValue) return 'critical'
    if (warningValue !== undefined && value >= warningValue) return 'warning'
    return 'nominal'
  }
  if (criticalValue !== undefined && value <= criticalValue) return 'critical'
  if (warningValue !== undefined && value <= warningValue) return 'warning'
  return 'nominal'
}

const FILL_COLOR: Record<Zone, string> = {
  nominal: 'bg-success',
  warning: 'bg-warning',
  critical: 'bg-danger',
}

const TEXT_COLOR: Record<Zone, string> = {
  nominal: 'text-success',
  warning: 'text-warning',
  critical: 'text-danger',
}

export function LevelIndicator({
  value,
  max,
  min = 0,
  warningValue,
  criticalValue,
  direction = 'above',
  style = 'continuousCapacity',
  segments,
  label,
  showValue = true,
  formatValue,
  className,
}: Props) {
  const clamped = Math.max(min, Math.min(max, value))
  const range = max - min
  const fraction = range > 0 ? (clamped - min) / range : 0
  const zone = zoneOf(clamped, warningValue, criticalValue, direction)
  const display = formatValue ? formatValue(clamped) : clamped.toFixed(2)

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="mb-1 flex items-baseline justify-between text-[10px] font-mono uppercase tracking-widest">
          {label && <span className="text-muted">{label}</span>}
          {showValue && (
            <span className={cn('tabular-nums', TEXT_COLOR[zone])}>{display}</span>
          )}
        </div>
      )}
      {style === 'continuousCapacity' ? (
        <ContinuousBar fraction={fraction} zone={zone} />
      ) : (
        <DiscreteBar
          fraction={fraction}
          zone={zone}
          segments={segments ?? Math.max(1, Math.round(range))}
        />
      )}
    </div>
  )
}

function ContinuousBar({ fraction, zone }: { fraction: number; zone: Zone }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-sm border border-divider bg-surface">
      <div
        className={cn('h-full transition-[width,background-color] duration-300', FILL_COLOR[zone])}
        style={{ width: `${(fraction * 100).toFixed(1)}%` }}
      />
    </div>
  )
}

function DiscreteBar({
  fraction,
  zone,
  segments,
}: {
  fraction: number
  zone: Zone
  segments: number
}) {
  const filled = Math.round(fraction * segments)
  return (
    <div className="flex h-2 w-full gap-0.5">
      {Array.from({ length: segments }, (_, i) => (
        <div
          key={i}
          className={cn(
            'flex-1 rounded-sm border transition-colors duration-300',
            i < filled
              ? cn(FILL_COLOR[zone], 'border-transparent')
              : 'border-divider bg-surface',
          )}
        />
      ))}
    </div>
  )
}
