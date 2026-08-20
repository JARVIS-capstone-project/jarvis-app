import { Outlet } from 'react-router'
import { Sidebar } from '@app/layout/sidebar'

/**
 * Admin surface shell — same sidebar as chat, but the main area hosts the
 * admin nested routes. Intentionally plain: no HUD chrome, the pages carry
 * their own layout.
 *
 * `h-screen`, not `h-full min-h-screen`, and the distinction is load-bearing.
 * The sidebar pins its user row to the bottom with a `flex-1` spacer, which
 * only has room to grow if the rail itself is full height — and the rail sizes
 * itself with `h-full`. A percentage height needs a parent whose height is
 * *definite*; `min-h-screen` leaves `height: auto`, so `h-full` fell back to
 * `auto` and the rail collapsed to its content, dropping the email directly
 * under the nav. Chat's shell has always used `h-screen`, which is why the
 * same sidebar anchors correctly there. `main` scrolls, so nothing is lost.
 */
export function AdminShellPage() {
  return (
    <div className="flex h-screen bg-canvas">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <header className="border-b border-divider px-6 py-4">
          <h1 className="font-display text-xl text-heading">Admin</h1>
        </header>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
