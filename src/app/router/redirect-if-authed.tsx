import type { ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router'
import { useIsAuthenticated } from '@modules/auth/model/auth-store'

interface Props {
  to: string
  children?: ReactNode
}

/**
 * Inverse guard — sends authed users away from public marketing routes.
 * Used on `/` so a returning logged-in user lands on /new instead of the
 * landing page.
 */
export function RedirectIfAuthed({ to, children }: Props) {
  const isAuthed = useIsAuthenticated()
  if (isAuthed) return <Navigate to={to} replace />
  return children ?? <Outlet />
}
