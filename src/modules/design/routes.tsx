import { lazy } from 'react'
import type { RouteObject } from 'react-router'

/**
 * Design references are developer surfaces — the colour palette and the
 * component gallery. Nobody reaches them in normal use, and the gallery in
 * particular imports one of nearly every component in the app, so keeping
 * them eager pulled a large slice of the UI into the main bundle for no one.
 * Suspense is handled once, at `AppRouter`.
 */
const ColorPalettePage = lazy(() =>
  import('@modules/design/ui/pages/color-palette-page').then((m) => ({
    default: m.ColorPalettePage,
  })),
)
const ComponentGalleryPage = lazy(() =>
  import('@modules/design/ui/pages/component-gallery-page').then((m) => ({
    default: m.ComponentGalleryPage,
  })),
)

// Full-bleed dev references; mounted outside the app shell layout.
export const designRoutes: RouteObject[] = [
  { path: 'design/color', element: <ColorPalettePage /> },
  { path: 'design/component', element: <ComponentGalleryPage /> },
]
