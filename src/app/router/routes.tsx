import { lazy } from 'react'
import type { RouteObject } from 'react-router'
import { AppLayout } from '@app/layout/app-layout'
import { landingRoutes } from '@modules/landing'
import { designRoutes } from '@modules/design'
import { authRoutes } from '@modules/auth'
import { chatRoutes } from '@modules/chat'
import { adminRoutes } from '@modules/admin/routes'

// Imported from the page module rather than the `design` barrel: the barrel
// also re-exports `designRoutes`, and pulling both through one specifier
// would defeat the split by tying this chunk to that module graph.
const DevIndexPage = lazy(() =>
  import('@modules/design/ui/pages/dev-index-page').then((m) => ({
    default: m.DevIndexPage,
  })),
)

/**
 * Each feature module owns and exports its own routes; the app shell only
 * composes them.
 *
 * - `/`      full-bleed landing (marketing entry)
 * - `/dev`   design-system index inside the AppLayout shell
 * - `/admin` admin surface — gated by <RequireRole role="ADMIN"> inside the group
 * - other    full-bleed pages (design references, auth) mounted outside the shell
 */
export const routes: RouteObject[] = [
  ...landingRoutes,
  ...chatRoutes,
  ...adminRoutes,
  {
    path: '/dev',
    element: <AppLayout />,
    children: [{ index: true, element: <DevIndexPage /> }],
  },
  ...designRoutes,
  ...authRoutes,
]
