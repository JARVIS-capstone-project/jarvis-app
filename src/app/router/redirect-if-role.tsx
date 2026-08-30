import type { ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router'
import { useAuthStore } from '@modules/auth/model/auth-store'

interface Props {
  role: 'ADMIN'
  to: string
  children?: ReactNode
}

/**
 * Inverse role guard — sends users WITH the given role AWAY. Used to keep
 * admins out of the user surface (chat/workspace) and route them to their
 * own admin home. FE-only enforcement; the BE currently permits admins on
 * user endpoints (every user chain is `authenticated()`), so this is a UX
 * lock, not a security boundary.
 */
export function RedirectIfRole({ role, to, children }: Props) {
  const roles = useAuthStore((s) => s.roles)
  if (roles.includes(role)) return <Navigate to={to} replace />
  return children ?? <Outlet />
}
