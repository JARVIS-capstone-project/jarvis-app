import { lazy } from 'react'
import { Navigate, type RouteObject } from 'react-router'
import { RequireRole } from '@app/router/require-role'

/**
 * Every admin page is code-split. The surface is reachable by admins only —
 * `RequireRole` redirects everyone else before a child mounts — so shipping
 * these in the main bundle charged every ordinary user for a screen they can
 * never open.
 *
 * The shell is split alongside its children rather than kept eager: it is the
 * admin chrome and has no reason to load for anyone who never reaches
 * `/admin`. Suspense is handled once, at `AppRouter`.
 */
const AdminShellPage = lazy(() =>
  import('@modules/admin/ui/pages/admin-shell-page').then((m) => ({
    default: m.AdminShellPage,
  })),
)
const AdminUsersPage = lazy(() =>
  import('@modules/admin/ui/pages/admin-users-page').then((m) => ({
    default: m.AdminUsersPage,
  })),
)
const AdminUserDetailPage = lazy(() =>
  import('@modules/admin/ui/pages/admin-user-detail-page').then((m) => ({
    default: m.AdminUserDetailPage,
  })),
)
const AdminAuditPage = lazy(() =>
  import('@modules/admin/ui/pages/admin-audit-page').then((m) => ({
    default: m.AdminAuditPage,
  })),
)
const AdminUsagePage = lazy(() =>
  import('@modules/admin/ui/pages/admin-usage-page').then((m) => ({
    default: m.AdminUsagePage,
  })),
)
const AdminDetectionPage = lazy(() =>
  import('@modules/admin/ui/pages/admin-detection-page').then((m) => ({
    default: m.AdminDetectionPage,
  })),
)
const AdminSystemPage = lazy(() =>
  import('@modules/admin/ui/pages/admin-system-page').then((m) => ({
    default: m.AdminSystemPage,
  })),
)

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
      { path: 'usage', element: <AdminUsagePage /> },
      { path: 'detection', element: <AdminDetectionPage /> },
      { path: 'users', element: <AdminUsersPage /> },
      { path: 'users/:id', element: <AdminUserDetailPage /> },
    ],
  },
]
