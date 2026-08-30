import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '@shared/lib/cn'

/**
 * The "…" overflow menu on a card. Hand-rolled rather than pulled from a
 * headless library: the app already ships `@radix-ui/react-accordion` and
 * nothing else, and a dropdown primitive would bring a floating-position
 * engine, a focus-trap layer, and a collision detector for a panel that only
 * ever hangs bottom-right of one button.
 *
 * `children` is a render prop receiving `close` so an item can decide for
 * itself whether selecting it dismisses the menu — a destructive action swaps
 * the panel for its own confirm step instead of closing (see `UserCard`).
 *
 * Closes on outside pointer-down, on Escape, and when the trigger is pressed
 * again. Escape restores focus to the trigger; an outside click deliberately
 * does not, since the pointer has already moved the user's attention.
 *
 * The parent must establish a positioning context — the panel is absolute.
 */
interface Props {
  /** Accessible name for the trigger, e.g. "Actions for khoa@bank.vn". */
  label: string
  children: (close: () => void) => ReactNode
  className?: string
}

export function CardMenu({ label, children, className }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }

    // `pointerdown`, not `click`: a menu that survives until mouseup reads as
    // laggy, and a click listener would also fire for the press that opened it.
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex size-7 items-center justify-center rounded-md border border-transparent text-muted transition-colors',
          'hover:border-divider hover:bg-hover hover:text-heading',
          open && 'border-divider bg-hover text-heading',
        )}
      >
        <MoreHorizontal className="size-4" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={label}
          className="absolute right-0 top-full z-20 mt-1 w-56 overflow-hidden rounded-lg border border-divider bg-panel p-1 shadow-lg"
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

interface ItemProps {
  onSelect: () => void
  icon?: ReactNode
  /** Renders the row in the danger token and marks it as the destructive path. */
  danger?: boolean
  /** Disabled rows keep their `title` as the only explanation of why. */
  disabled?: boolean
  title?: string
  children: ReactNode
}

export function CardMenuItem({
  onSelect,
  icon,
  danger,
  disabled,
  title,
  children,
}: ItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onSelect}
      disabled={disabled}
      title={title}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-40',
        danger
          ? 'text-danger enabled:hover:bg-danger-soft'
          : 'text-body enabled:hover:bg-hover enabled:hover:text-heading',
      )}
    >
      {icon}
      {children}
    </button>
  )
}

/**
 * A row that navigates. Separate from `CardMenuItem` because that one renders
 * a <button>, and an <a> nested inside a button is invalid HTML — browsers
 * reparent it, which drops the click handler that closes the menu.
 */
export function CardMenuLink({
  to,
  onSelect,
  icon,
  children,
}: {
  to: string
  /** Fired alongside navigation, so the menu can close behind the transition. */
  onSelect?: () => void
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <Link
      to={to}
      role="menuitem"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm',
        'text-body transition-colors hover:bg-hover hover:text-heading',
      )}
    >
      {icon}
      {children}
    </Link>
  )
}

/** Hairline between groups of items. */
export function CardMenuSeparator() {
  return <div className="my-1 h-px bg-divider" />
}
