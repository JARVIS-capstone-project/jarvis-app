import { Outlet } from 'react-router'
import { Sidebar } from '@app/layout/sidebar'

/**
 * Admin surface shell — same sidebar as chat, but the main area hosts the
 * admin nested routes. Intentionally plain (no HUD chrome, no fancy layout)
 * per the "UI later" directive; we just need the pages to render.
 */
export function AdminShellPage() {
  return (
    <div className="flex h-full min-h-screen bg-canvas">
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
