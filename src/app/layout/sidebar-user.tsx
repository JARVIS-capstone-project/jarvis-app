import { useState } from 'react'
import { ChevronUp, UserRound } from 'lucide-react'
import { UserMenuPopover } from '@app/layout/user-menu-popover'
import { settings } from '@shared/model/settings-store'
import { useTheme } from '@app/providers/theme-context'
import { useLogout } from '@modules/auth/model/use-logout'
import { useMe } from '@modules/auth/model/use-me'

/**
 * Sidebar footer row — shows the authenticated caller's email and opens
 * the user popover on click. Also acts as a ghost-session tripwire: `useMe`
 * fires `GET /auth/me` on mount, and on 401 clears the auth store +
 * redirects to /login. So a user whose account was deleted server-side
 * (but who still holds a valid-looking token in localStorage) gets bounced
 * within one page load.
 *
 * Only the popover's own open/closed state lives here. The settings modal is
 * mounted once at the app root and opened through `settings.open(section)` —
 * the composer's MCP menu reaches the same dialog, and two owners would mean
 * two dialogs.
 */
export function SidebarUser() {
  const { data, loading } = useMe()
  const { theme } = useTheme()
  const { logout } = useLogout()
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        title={data?.email}
        className="flex h-11 w-full items-center gap-3 rounded-md px-3 transition-colors hover:bg-hover"
      >
        <span className="flex shrink-0 text-muted">
          <UserRound className="size-5" />
        </span>
        <span className="flex-1 truncate text-left text-sm font-medium text-body">
          {loading ? (
            <span className="inline-block h-4 w-24 animate-pulse rounded bg-surface" />
          ) : (
            data?.email ?? 'Unknown'
          )}
        </span>
        <ChevronUp className="size-4 shrink-0 text-muted" />
      </button>
      <UserMenuPopover
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onOpenSettings={() => settings.open()}
        onOpenTheme={() => settings.open('theme')}
        onLogout={logout}
        currentTheme={theme}
      />
    </div>
  )
}
