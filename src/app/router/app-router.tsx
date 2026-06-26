import { useRoutes } from 'react-router'
import { routes } from '@app/router/routes'

export function AppRouter() {
  return useRoutes(routes)
}
