import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@shared/lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual role, mapped onto the J.A.R.V.I.S color tokens. */
  variant?: ButtonVariant
  /** Scale — drives height, padding and text size only. */
  size?: ButtonSize
  /** Shows a spinner and blocks interaction (also disables + sets aria-busy). */
  isLoading?: boolean
  /** Icon before the label; replaced by the spinner while loading. */
  leftIcon?: ReactNode
  /** Icon after the label. */
  rightIcon?: ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-hover',
  secondary: 'bg-surface text-heading border border-divider hover:bg-hover',
  ghost: 'text-body hover:bg-hover',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
}

// Square dimensions for icon-only buttons (no label). Pass aria-label for a11y.
const iconOnlySizeClasses: Record<ButtonSize, string> = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  // No label + an icon → render a square icon-only button.
  const iconOnly = !children && (Boolean(leftIcon) || Boolean(rightIcon) || isLoading)
  return (
    <button
      // Loading must also disable, else the click handler can fire mid-request.
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        iconOnly ? iconOnlySizeClasses[size] : sizeClasses[size],
        className,
      )}
      {...props}
    >
      {isLoading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : leftIcon}
      {children}
      {rightIcon}
    </button>
  )
}
