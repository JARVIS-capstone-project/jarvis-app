import type { ComponentType } from 'react'
import { useCallback } from 'react'
import { Archive, MessageSquare } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'
import { useTheme } from '@app/providers/theme-context'

export interface SidebarFeature {
  key: string
  label: string
  /** Lucide icon component — the view instantiates it (`<Icon className="…" />`)
   *  so the hook stays JSX-free, matching the useLogin pattern in the auth module. */
  Icon: ComponentType<{ className?: string }>
  isActive: boolean
  onSelect?: () => void
  /** Tooltip shown when the item has no route yet; treated as inert. */
  disabledHint?: string
}

interface UseSidebarShellResult {
  features: SidebarFeature[]
  isDarkMode: boolean
  onToggleTheme: (checked: boolean) => void
}

/**
 * Sidebar view-model. Owns the feature list (routing) + darkmode wire-up.
 * Open/closed state is NOT here — that's a layout concern owned by the
 * page (see chat-page.tsx), because the same flag drives whether the
 * sidebar renders AND whether the chat section shows its expand button.
 */
export function useSidebarShell(): UseSidebarShellResult {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { theme, setTheme } = useTheme()

  const onToggleTheme = useCallback(
    (checked: boolean) => setTheme(checked ? 'dark' : 'light'),
    [setTheme],
  )

  const features: SidebarFeature[] = [
    {
      key: 'chat',
      label: 'Chat',
      Icon: MessageSquare,
      isActive: pathname === '/new',
      onSelect: () => navigate('/new'),
    },
    {
      key: 'workspace',
      label: 'Workspace',
      Icon: Archive,
      isActive: false,
      disabledHint: 'Workspace — coming soon',
    },
  ]

  return {
    features,
    isDarkMode: theme === 'dark',
    onToggleTheme,
  }
}
