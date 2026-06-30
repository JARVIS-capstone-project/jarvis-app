import type { RouteObject } from 'react-router'
import { LandingPage } from '@modules/landing/ui/pages/landing-page'

export const landingRoutes: RouteObject[] = [{ index: true, element: <LandingPage /> }]
