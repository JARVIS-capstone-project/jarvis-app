import { Suspense } from 'react'
import { useRoutes } from 'react-router'
import { routes } from '@app/router/routes'
import { Spinner } from '@shared/ui/spinner'

/**
 * One Suspense boundary for every code-split route. Route modules resolve in
 * milliseconds off a warm cache, so per-route boundaries would buy nothing
 * but more places for a fallback to look slightly different.
 *
 * `useRoutes` is a non-data router, so React Router's own `lazy` route
 * property does not apply here — the splitting is `React.lazy` inside each
 * module's route table, and this is what catches it.
 */
export function AppRouter() {
  return <Suspense fallback={<RouteFallback />}>{useRoutes(routes)}</Suspense>
}

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner size="lg" tone="muted" />
    </div>
  )
}
