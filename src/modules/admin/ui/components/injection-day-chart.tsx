import { useMemo, useState } from 'react'
import { cn } from '@shared/lib/cn'

/**
 * Flagged turns per day — one bar per UTC day in the window.
 *
 * **The API omits quiet days entirely** (`by_day` is "chronological, gaps
 * meaning zero"), so the series is rebuilt across the full window before it
 * is drawn. Plotting the rows as they arrive would space bars by *row index*
 * rather than by date: three attempts on the 1st and three on the 20th would
 * render as two adjacent bars, which reads as a two-day burst instead of two
 * isolated incidents three weeks apart. The zero days are the shape.
 *
 * A bar, not a line: days are discrete buckets and a zero is a real
 * observation, not a dip to interpolate through.
 *
 * One series, one hue — the `warning` token, because every bar here counts
 * the same thing and that thing is an attempt. No legend: the heading names
 * the series. Values live in the hover tooltip and the totals above rather
 * than as a number over every bar.
 */
interface Props {
  since: string
  days: { day: string; turns: number }[]
  className?: string
}

/** UTC day key, matching how the platform buckets (`date` in the schema). */
const dayKey = (d: Date) => d.toISOString().slice(0, 10)

export function InjectionDayChart({ since, days, className }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)

  const series = useMemo(() => {
    const counts = new Map(days.map((d) => [d.day.slice(0, 10), d.turns]))
    const start = new Date(since)
    const end = new Date()
    const out: { day: string; turns: number }[] = []
    // Walk UTC midnights so a local-midnight cursor cannot skip or repeat a
    // day when the browser's offset differs from UTC.
    const cursor = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()),
    )
    while (cursor <= end && out.length < 62) {
      const key = dayKey(cursor)
      out.push({ day: key, turns: counts.get(key) ?? 0 })
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
    return out
  }, [since, days])

  const max = Math.max(1, ...series.map((d) => d.turns))
  const active = series.find((d) => d.day === hovered)

  return (
    <figure className={cn('flex flex-col gap-1.5', className)}>
      <div
        className="flex h-24 items-end gap-0.5"
        onPointerLeave={() => setHovered(null)}
      >
        {series.map((d) => (
          <button
            key={d.day}
            type="button"
            onPointerEnter={() => setHovered(d.day)}
            onFocus={() => setHovered(d.day)}
            onBlur={() => setHovered(null)}
            aria-label={`${d.day}: ${d.turns} flagged turn${d.turns === 1 ? '' : 's'}`}
            // The button spans the full height so the hit target is the whole
            // column, not just the few pixels a low bar occupies.
            className="group flex h-full flex-1 items-end justify-center"
          >
            <span
              className={cn(
                'w-full rounded-t-[4px] transition-colors',
                d.turns === 0 ? 'bg-divider' : 'bg-warning',
                hovered === d.day && d.turns > 0 && 'bg-warning/70',
              )}
              // A zero still draws a 2px stub: an empty column is
              // indistinguishable from a missing one, and this window's whole
              // point is which days were quiet.
              style={{
                height: d.turns === 0 ? '2px' : `${Math.max(6, (d.turns / max) * 100)}%`,
              }}
            />
          </button>
        ))}
      </div>

      <figcaption className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-muted">
        <span>{series[0]?.day.slice(5)}</span>
        <span className={cn('transition-opacity', active ? 'opacity-100' : 'opacity-0')}>
          {active ? `${active.day.slice(5)} · ${active.turns} flagged` : ' '}
        </span>
        <span>{series[series.length - 1]?.day.slice(5)}</span>
      </figcaption>
    </figure>
  )
}
