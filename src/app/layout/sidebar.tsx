import type { ReactNode } from 'react'
import { PanelLeftClose } from 'lucide-react'
import { SidebarUser } from '@app/layout/sidebar-user'
import { useSidebarShell } from '@app/layout/use-sidebar-shell'
import { SessionHistory } from '@modules/chat/ui/components/session-history'
import { BrandMark } from '@shared/ui/brand-mark'
import { ItemButton } from '@shared/ui/item-button'

interface SidebarProps {
  /** When provided, a close button appears in the header. Consumed by the
   *  page layout (chat-page owns the open/closed state). */
  onClose?: () => void
}

/**
 * App shell — the left rail. Pure JSX; all state (routing, theme) is owned
 * by useSidebarShell. Open/closed lives one level up in the page layout,
 * so this component always renders full-width when mounted.
 */
export function Sidebar({ onClose }: SidebarProps) {
  const { features } = useSidebarShell()

  return (
    // Below md: fixed overlay drawer (z-50, sits over the chat).
    // md+:      flex child in the page's row layout — pushes chat as before.
    <aside className="fixed inset-y-0 left-0 z-50 flex h-full w-72 shrink-0 flex-col gap-6 bg-canvas px-4 py-6 text-heading md:relative md:z-auto">
      <header className="flex items-center gap-3 px-2">
        <BrandMark className="h-8" />
        <span className="font-display text-lg font-bold tracking-wide text-heading">
          J.A.R.V.I.S
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="ml-auto flex size-8 items-center justify-center rounded-md text-body transition-colors hover:bg-hover hover:text-heading"
          >
            <PanelLeftClose className="size-5" />
          </button>
        )}
      </header>

      <nav className="flex flex-col gap-1">
        <SidebarLabel>Features</SidebarLabel>
        {features.map(({ key, label, Icon, isActive, onSelect, disabledHint }) => (
          <ItemButton
            key={key}
            isActive={isActive}
            leftIcon={<Icon className="size-5" />}
            onClick={onSelect}
            title={disabledHint}
          >
            {label}
          </ItemButton>
        ))}
      </nav>

      <div className="flex min-h-0 flex-1 flex-col">
        <SessionHistory />
      </div>

      <div className="flex flex-col gap-1">
        <SidebarUser />
      </div>
    </aside>
  )
}

function SidebarLabel({ children }: { children: ReactNode }) {
  return (
    <span className="px-3 text-xs font-medium uppercase tracking-wider text-muted">
      {children}
    </span>
  )
}
