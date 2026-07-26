import type { HTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@shared/lib/cn'

export type SpinnerSize = 'sm' | 'md' | 'lg'
export type SpinnerTone = 'brand' | 'muted' | 'inverse'

interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  /** Icon scale (also controls the label text size). */
  size?: SpinnerSize
  /** Color of the icon + label. Uses semantic tokens so it flips with the theme. */
  tone?: SpinnerTone
  /** Optional label rendered next to the spinner (announced to screen readers). */
  label?: string
}

const iconSizeClasses: Record<SpinnerSize, string> = {
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-7',
}

const textSizeClasses: Record<SpinnerSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
}

const toneClasses: Record<SpinnerTone, string> = {
  brand: 'text-brand',
  muted: 'text-muted',
  inverse: 'text-white',
}

const gapClasses: Record<SpinnerSize, string> = {
  sm: 'gap-1.5',
  md: 'gap-2',
  lg: 'gap-2.5',
}

/**
 * Generic loading spinner. `aria-busy` marks the element as loading and the
 * label (when provided) is announced via `aria-live="polite"` — screen readers
 * hear "Loading messages…" instead of nothing.
 *
 * Use for buttons, sidebar rows, modal placeholders — anywhere a small
 * indicator suffices. For content that has a strong layout shape (chat
 * message list, table rows), prefer a skeleton over this.
 */
export function Spinner({
  size = 'md',
  tone = 'brand',
  label,
  className,
  ...props
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={cn(
        'inline-flex items-center',
        gapClasses[size],
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      <Loader2 className={cn('animate-spin', iconSizeClasses[size])} aria-hidden="true" />
      {label && <span className={cn('font-medium', textSizeClasses[size])}>{label}</span>}
    </span>
  )
}
