import type { ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router'
import { useAuthStore } from '@modules/auth/model/auth-store'

interface Props {
  role: 'ADMIN'
  to: string
  children?: ReactNode
}

/**
 * Role guard mirroring `RedirectIfAuthed` — synchronous check against the
 * decoded roles in the auth store. Failing the check `<Navigate>`s silently;
 * do not surface a "forbidden" toast (spec: non-admins should not learn the
 * admin surface exists).
 */
export function RequireRole({ role, to, children }: Props) {
  const roles = useAuthStore((s) => s.roles)
  if (!roles.includes(role)) return <Navigate to={to} replace />
  return children ?? <Outlet />
}
