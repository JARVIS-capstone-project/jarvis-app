import type { RouteObject } from 'react-router'
import { AppLayout } from '@app/layout/app-layout'
import { homeRoutes } from '@modules/home'
import { exampleRoutes } from '@modules/example'

/**
 * Each feature module owns and exports its own routes; the app shell only
 * composes them under the shared layout. Add a module's routes here.
 */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [...homeRoutes, ...exampleRoutes],
  },
]
