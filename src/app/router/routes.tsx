import type { RouteObject } from 'react-router'
import { AppLayout } from '@app/layout/app-layout'
import { landingRoutes } from '@modules/landing'
import { DevIndexPage, designRoutes } from '@modules/design'
import { authRoutes } from '@modules/auth'
import { chatRoutes } from '@modules/chat'

/**
 * Each feature module owns and exports its own routes; the app shell only
 * composes them.
 *
 * - `/`      full-bleed landing (marketing entry)
 * - `/dev`   design-system index inside the AppLayout shell
 * - other    full-bleed pages (design references, auth) mounted outside the shell
 */
export const routes: RouteObject[] = [
  ...landingRoutes,
  ...chatRoutes,
  {
    path: '/dev',
    element: <AppLayout />,
    children: [{ index: true, element: <DevIndexPage /> }],
  },
  ...designRoutes,
  ...authRoutes,
]
