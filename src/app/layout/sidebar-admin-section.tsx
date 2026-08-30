import { NavLink } from 'react-router'
import { Activity, ClipboardList, Gauge, Shield, ShieldAlert, Users } from 'lucide-react'
import { useIsAdmin } from '@modules/auth/model/auth-store'
import { cn } from '@shared/lib/cn'

interface Item {
  to: string
  label: string
  Icon: typeof Users
}

const ITEMS: Item[] = [
  { to: '/admin/system', label: 'System', Icon: Activity },
  { to: '/admin/audit', label: 'Audit', Icon: ClipboardList },
  { to: '/admin/usage', label: 'Usage', Icon: Gauge },
  { to: '/admin/detection', label: 'Detection', Icon: ShieldAlert },
  { to: '/admin/users', label: 'Users', Icon: Users },
]

/**
 * Conditional Admin nav block for the sidebar. Renders nothing for non-admins
 * (silent — never hint the surface exists). Uppercase 'ADMIN' matches the JWT
 * roles claim exactly.
 */
export function SidebarAdminSection() {
  const isAdmin = useIsAdmin()
  if (!isAdmin) return null
  return (
    <nav className="flex flex-col gap-1">
      <span className="px-3 pb-1 text-xs font-medium uppercase tracking-wider text-muted">
        <Shield className="mr-1 inline size-3" /> Admin
      </span>
      {ITEMS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
              isActive
                ? 'bg-hover text-heading'
                : 'text-body hover:bg-hover hover:text-heading',
            )
          }
        >
          <Icon className="size-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
