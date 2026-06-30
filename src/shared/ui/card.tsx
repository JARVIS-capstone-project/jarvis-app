import type { HTMLAttributes } from 'react'
import { cn } from '@shared/lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Use the surface tone instead of the brighter panel. */
  surface?: boolean
}

/**
 * Container surface — standardizes radius + border so panels, the composer and
 * list rows stay consistent. Intentionally unpadded; callers add their own.
 */
export function Card({ surface = false, className, ...props }: CardProps) {
  return (
    <div
      className={cn('rounded-2xl border border-divider', surface ? 'bg-surface' : 'bg-panel', className)}
      {...props}
    />
  )
}
