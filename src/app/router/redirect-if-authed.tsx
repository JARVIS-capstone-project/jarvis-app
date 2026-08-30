import type { ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router'
import { useAuthStore, useIsAuthenticated } from '@modules/auth/model/auth-store'

interface Props {
  to: string
  children?: ReactNode
}

/**
 * Inverse guard — sends authed users away from public marketing / auth
 * routes. Used on `/`, `/login`, `/register`, etc.
 *
 * Role-aware: admins always land on `/admin/system` regardless of the `to`
 * prop, because they are blocked from the user surface (chat) by
 * `<RedirectIfRole>` anyway. Routing them directly avoids a two-hop chain
 * through `/new`.
 */
export function RedirectIfAuthed({ to, children }: Props) {
  const isAuthed = useIsAuthenticated()
  const isAdmin = useAuthStore((s) => s.roles.includes('ADMIN'))
  if (isAuthed) return <Navigate to={isAdmin ? '/admin/system' : to} replace />
  return children ?? <Outlet />
}
