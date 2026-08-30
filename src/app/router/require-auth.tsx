import type { ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router'
import { useIsAuthenticated } from '@modules/auth/model/auth-store'

/**
 * Route-level guard. Wrap the outer `element` of any protected route:
 *   { path: '/x', element: <RequireAuth><AppLayout /></RequireAuth>, children: [...] }
 * Unauthenticated visits are replaced (not pushed) so the browser back button
 * doesn't loop the user through /login.
 */
export function RequireAuth({ children }: { children?: ReactNode }) {
  const isAuthed = useIsAuthenticated()
  if (!isAuthed) return <Navigate to="/login" replace />
  return children ?? <Outlet />
}
