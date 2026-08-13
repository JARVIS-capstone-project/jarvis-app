import { AppRouter } from '@app/router/app-router'
import { ToastHost } from '@shared/ui/toast'

export function App() {
  return (
    <>
      <AppRouter />
      {/* Outside the router on purpose: an action that navigates still has to
          report its own outcome, and a host mounted inside a route unmounts
          mid-flight when that happens. */}
      <ToastHost />
    </>
  )
}
