import type { ReactNode } from 'react'
import { PanelLeftClose } from 'lucide-react'
import { SidebarUser } from '@app/layout/sidebar-user'
import { SidebarAdminSection } from '@app/layout/sidebar-admin-section'
import { useSidebarShell } from '@app/layout/use-sidebar-shell'
import { useIsAdmin } from '@modules/auth/model/auth-store'
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
  // Admins are blocked from user routes (chat, workspace) so their nav
  // shouldn't advertise those either — hide the Features + SessionHistory
  // sections and show only the Admin nav + user popover.
  const isAdmin = useIsAdmin()

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

      {!isAdmin && (
        <>
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
        </>
      )}

      <SidebarAdminSection />

      {/* Push user popover to the bottom when the middle sections are hidden. */}
      {isAdmin && <div className="flex-1" />}

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
