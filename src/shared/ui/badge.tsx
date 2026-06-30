import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@shared/lib/cn'

export type BadgeVariant = 'neutral' | 'brand' | 'success' | 'danger' | 'warning'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  /** Small status/type icon before the label (size it `size-3.5`). */
  leftIcon?: ReactNode
}

// Soft token bg + solid token text — status colors come from Phase 1 tokens.
const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'bg-surface text-muted',
  brand: 'bg-brand-glow-soft text-brand',
  success: 'bg-success-soft text-success',
  danger: 'bg-danger-soft text-danger',
  warning: 'bg-warning-soft text-warning',
}

export function Badge({ variant = 'neutral', leftIcon, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {leftIcon}
      {children}
    </span>
  )
}
