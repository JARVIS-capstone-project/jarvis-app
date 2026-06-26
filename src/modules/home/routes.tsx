import type { RouteObject } from 'react-router'
import { HomePage } from '@modules/home/ui/pages/home-page'

export const homeRoutes: RouteObject[] = [{ index: true, element: <HomePage /> }]
