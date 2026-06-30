import type { RouteObject } from 'react-router'
import { ColorPalettePage } from '@modules/design/ui/pages/color-palette-page'
import { ComponentGalleryPage } from '@modules/design/ui/pages/component-gallery-page'

// Full-bleed dev references; mounted outside the app shell layout.
export const designRoutes: RouteObject[] = [
  { path: 'design/color', element: <ColorPalettePage /> },
  { path: 'design/component', element: <ComponentGalleryPage /> },
]
