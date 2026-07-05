import type { RouteObject } from 'react-router'
import { LoginPage } from '@modules/auth/ui/pages/login-page'

// Full-bleed HUD screen; mounted outside the app shell layout so the arc
// reactor rings can fill the viewport without a wrapping header.
export const authRoutes: RouteObject[] = [{ path: 'login', element: <LoginPage /> }]
