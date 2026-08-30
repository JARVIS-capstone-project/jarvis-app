import type { RouteObject } from 'react-router'
import { LandingPage } from '@modules/landing/ui/pages/landing-page'
import { RedirectIfAuthed } from '@app/router/redirect-if-authed'

// Full-bleed marketing entry — mounted at `/`, outside the AppLayout shell.
// Authed visitors are bounced to /new so they don't see marketing.
export const landingRoutes: RouteObject[] = [
  {
    path: '/',
    element: (
      <RedirectIfAuthed to="/new">
        <LandingPage />
      </RedirectIfAuthed>
    ),
  },
]
