import { Navigate, type RouteObject } from 'react-router'
import { RequireRole } from '@app/router/require-role'
import { AdminShellPage } from '@modules/admin/ui/pages/admin-shell-page'
import { AdminUsersPage } from '@modules/admin/ui/pages/admin-users-page'
import { AdminUserDetailPage } from '@modules/admin/ui/pages/admin-user-detail-page'
import { AdminAuditPage } from '@modules/admin/ui/pages/admin-audit-page'
import { AdminSystemPage } from '@modules/admin/ui/pages/admin-system-page'

/**
 * Admin route group. All routes are gated by `RequireRole role="ADMIN"` at
 * the parent — the guard `<Navigate>`s non-admins to `/new` before any
 * child page mounts, so no leak of admin URLs' existence.
 */
export const adminRoutes: RouteObject[] = [
  {
    path: '/admin',
    element: (
      <RequireRole role="ADMIN" to="/new">
        <AdminShellPage />
      </RequireRole>
    ),
    children: [
      // Admin's home is /admin/system — health + metrics + login history is
      // the first-look surface after login. Users/audit are drill-downs.
      { index: true, element: <Navigate to="system" replace /> },
      { path: 'system', element: <AdminSystemPage /> },
      { path: 'audit', element: <AdminAuditPage /> },
      { path: 'users', element: <AdminUsersPage /> },
      { path: 'users/:id', element: <AdminUserDetailPage /> },
    ],
  },
]
