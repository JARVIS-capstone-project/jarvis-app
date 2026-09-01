import type { RouteObject } from 'react-router'
import { LandingPage } from '@modules/landing/ui/pages/landing-page'

// Full-bleed marketing entry — mounted at `/`, outside the AppLayout shell.
// Authed visitors are allowed through: the landing nav shows their profile
// pill + a Dashboard dropdown (see landing-nav.tsx UserMenu). Auth routes
// (/login, /register, …) still bounce authed users to /new — that guard lives
// in modules/auth/routes.tsx.
export const landingRoutes: RouteObject[] = [
  {
    path: '/',
    element: <LandingPage />,
  },
]
