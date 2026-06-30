import type { RouteObject } from 'react-router'
import { AppLayout } from '@app/layout/app-layout'
import { landingRoutes } from '@modules/landing'
import { designRoutes } from '@modules/design'

/**
 * Each feature module owns and exports its own routes; the app shell only
 * composes them under the shared layout. Add a module's routes here.
 */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [...landingRoutes],
  },
  // Full-bleed dev pages rendered outside the app shell layout.
  ...designRoutes,
]
