import type { RouteObject } from 'react-router'
import { ExamplePage } from '@modules/example/ui/pages/example-page'

export const exampleRoutes: RouteObject[] = [
  { path: 'examples', element: <ExamplePage /> },
]
