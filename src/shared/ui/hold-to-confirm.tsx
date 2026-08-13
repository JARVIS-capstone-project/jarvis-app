import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@shared/lib/cn'

interface Props {
  /** Fired once the hold completes. Never fired on an early release. */
  onConfirm: () => void
  /** How long the user must hold, in ms. */
  durationMs?: number
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

/**
 * A button that only acts after the user has held it down for `durationMs`,
 * filling left-to-right as it counts. Releasing early cancels outright — no
 * partial progress is kept, so a slip costs nothing.
 *
 * The fill is a second copy of the label stacked over the first and revealed
 * with `clip-path: inset()`, rather than a bar behind the text: the label has
 * to invert along with the background or it turns unreadable at the boundary.
 * The overlay is `aria-hidden` so the duplicated text is not announced twice.
 *
 * Two transition speeds, and the asymmetry is the point. Filling is `linear`
 * over the full duration because it is a progress readout — an eased fill
 * would misreport how much time is left. Emptying is a fast ease-out, because
 * once the user has let go the animation is no longer information, and a
 * cancel that unwinds as slowly as it wound up feels stuck.
 *
 * Keyboard: Space and Enter hold while pressed, matching the pointer path.
 * `event.repeat` is ignored so the browser's key-repeat cannot restart the
 * timer mid-hold and stretch it indefinitely.
 */
export function HoldToConfirm({
  onConfirm,
  durationMs = 2000,
  children,
  className,
  disabled,
}: Props) {
  const [holding, setHolding] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setHolding(false)
  }, [])

  const start = useCallback(() => {
    if (disabled || timerRef.current) return
    setHolding(true)
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      setHolding(false)
      onConfirm()
    }, durationMs)
  }, [disabled, durationMs, onConfirm])

  // A hold that outlives the component — the dialog closing on confirm, say —
  // must not leave a timer able to fire a second delete into a closed surface.
  useEffect(() => cancel, [cancel])

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={start}
      onPointerUp={cancel}
      // Covers the drag-off-the-button case, which `onPointerUp` misses: the
      // pointer leaves and the release lands on some other element entirely.
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onKeyDown={(e) => {
        if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
          e.preventDefault() // stop Space from also firing a click
          start()
        }
      }}
      onKeyUp={(e) => {
        if (e.key === ' ' || e.key === 'Enter') cancel()
      }}
      onBlur={cancel}
      className={cn(
        'relative select-none overflow-hidden rounded-lg border border-danger/50',
        'bg-transparent px-4 py-2 text-sm font-medium text-danger',
        'transition-transform duration-150 active:scale-[0.97]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
    >
      <span className="relative z-10">{children}</span>

      {/* The filling copy. Inset from the right at rest, opened to zero while
          held — the same element and the same text, so the two layers stay
          pixel-aligned as the boundary sweeps across. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 z-20 flex items-center justify-center bg-danger px-4 py-2 text-sm font-medium text-white"
        style={{
          clipPath: holding ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
          transition: holding
            ? `clip-path ${durationMs}ms linear`
            : 'clip-path 200ms ease-out',
        }}
      >
        {children}
      </span>
    </button>
  )
}
