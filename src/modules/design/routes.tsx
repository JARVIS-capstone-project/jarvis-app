import type { RouteObject } from 'react-router'
import { ColorPalettePage } from '@modules/design/ui/pages/color-palette-page'

// Full-bleed dev reference; mounted outside the app shell layout.
export const designRoutes: RouteObject[] = [{ path: 'design/color', element: <ColorPalettePage /> }]
