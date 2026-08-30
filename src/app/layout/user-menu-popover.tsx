import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { LogOut, Palette, Settings } from 'lucide-react'
import type { Theme } from '@app/providers/theme-context'
import { cn } from '@shared/lib/cn'

interface UserMenuPopoverProps {
  open: boolean
  onClose: () => void
  /** Opens the settings modal at the top (Profile section). */
  onOpenSettings: () => void
  /** Opens the settings modal deep-linked to the Theme section. */
  onOpenTheme: () => void
  onLogout: () => void
  currentTheme: Theme
}

/**
 * Popover anchored ABOVE the sidebar user row. Three menu items:
 *   1. Setting — closes popover, opens the settings modal.
 *   2. Theme — closes popover, opens the settings modal scrolled to the
 *      theme section. Right-hand badge shows the current theme label.
 *   3. Log out — closes popover, fires the logout pipeline.
 *
 * Close on: outside click, Escape, or any item action. Unmounted (not
 * hidden) while closed so stale focus can't survive across opens.
 */
export function UserMenuPopover({
  open,
  onClose,
  onOpenSettings,
  onOpenTheme,
  onLogout,
  currentTheme,
}: UserMenuPopoverProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  const themeLabel = currentTheme === 'dark' ? 'Dark' : 'Light'

  return (
    <div
      ref={ref}
      role="menu"
      className="absolute bottom-full left-0 right-0 mb-2 rounded-lg border border-divider bg-surface p-1 shadow-lg"
    >
      <MenuItem
        icon={<Settings className="size-4" />}
        label="Setting"
        onClick={() => {
          onClose()
          onOpenSettings()
        }}
      />
      <MenuItem
        icon={<Palette className="size-4" />}
        label="Theme"
        badge={themeLabel}
        onClick={() => {
          onClose()
          onOpenTheme()
        }}
      />
      <MenuItem
        icon={<LogOut className="size-4" />}
        label="Log out"
        onClick={() => {
          onClose()
          onLogout()
        }}
      />
    </div>
  )
}

interface MenuItemProps {
  icon: ReactNode
  label: string
  badge?: string
  title?: string
  disabled?: boolean
  onClick?: () => void
}

function MenuItem({ icon, label, badge, title, disabled, onClick }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
        disabled
          ? 'cursor-not-allowed text-muted'
          : 'text-body hover:bg-hover hover:text-heading',
      )}
    >
      <span className="shrink-0 text-muted">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge && <span className="text-xs text-muted">{badge}</span>}
    </button>
  )
}
