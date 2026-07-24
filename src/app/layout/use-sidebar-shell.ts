import type { ComponentType } from 'react'
import { Archive, MessageSquare } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'

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
}

/**
 * Sidebar view-model. Owns the feature list (routing) only. Theme and user
 * actions moved into `<SidebarUser>` — those live inside the footer popover
 * now, so the shell hook no longer needs to know about them.
 *
 * Open/closed state is NOT here — that's a layout concern owned by the
 * page (see chat-page.tsx), because the same flag drives whether the
 * sidebar renders AND whether the chat section shows its expand button.
 */
export function useSidebarShell(): UseSidebarShellResult {
  const navigate = useNavigate()
  const { pathname } = useLocation()

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

  return { features }
}
