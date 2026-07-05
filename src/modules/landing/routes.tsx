import type { RouteObject } from 'react-router'
import { LandingPage } from '@modules/landing/ui/pages/landing-page'

// Full-bleed marketing entry — mounted at `/`, outside the AppLayout shell.
export const landingRoutes: RouteObject[] = [{ path: '/', element: <LandingPage /> }]
