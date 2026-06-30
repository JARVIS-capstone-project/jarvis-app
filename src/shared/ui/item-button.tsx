import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@shared/lib/cn'

interface ItemButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Highlights the item as the current selection (brand fill, white text). */
  isActive?: boolean
  /** Collapsed (shrunk) sidebar: hide the label and show only the icon. */
  collapsed?: boolean
  /** Icon before the label. */
  leftIcon?: ReactNode
  /** Icon after the label (e.g. a chevron or count). */
  rightIcon?: ReactNode
}

/**
 * Sidebar / list navigation item. Active uses the brand fill (identical in both
 * modes); the inactive state rides on semantic tokens, so light/dark swap for
 * free. With no children it collapses to a square icon-only button — pass
 * `aria-label` for accessibility.
 */
export function ItemButton({
  isActive = false,
  collapsed = false,
  leftIcon,
  rightIcon,
  className,
  children,
  ...props
}: ItemButtonProps) {
  // Collapsed always shrinks to the icon; otherwise auto-collapse when there's no label.
  const iconOnly = collapsed || (!children && Boolean(leftIcon || rightIcon))
  // Inactive icons sit one step muted below the label; active inherits white.
  const iconColor = isActive ? undefined : 'text-muted'
  // Collapsed hides the label — surface it to AT and as a hover tooltip.
  const collapsedLabel = collapsed && typeof children === 'string' ? children : undefined

  return (
    <button
      aria-current={isActive ? 'page' : undefined}
      aria-label={collapsedLabel}
      title={collapsedLabel}
      className={cn(
        'inline-flex items-center rounded-xl text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
        iconOnly ? 'size-10 justify-center' : 'h-11 w-full gap-3 px-3',
        isActive ? 'bg-brand text-white' : 'text-body hover:bg-hover',
        className,
      )}
      {...props}
    >
      {leftIcon && <span className={cn('flex shrink-0', iconColor)}>{leftIcon}</span>}
      {!iconOnly && <span className="flex-1 truncate text-left">{children}</span>}
      {!iconOnly && rightIcon && <span className={cn('flex shrink-0', iconColor)}>{rightIcon}</span>}
    </button>
  )
}
