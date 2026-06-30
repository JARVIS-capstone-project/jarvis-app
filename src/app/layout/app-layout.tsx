import { Link, Outlet } from 'react-router'

export function AppLayout() {
  return (
    <div className="min-h-screen text-body">
      <header className="border-b border-divider bg-surface">
        <nav className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-4">
          <span className="font-display font-bold text-heading">Jarvis</span>
          <Link className="text-sm font-medium text-body hover:text-brand" to="/">
            Home
          </Link>
          <Link className="text-sm font-medium text-body hover:text-brand" to="/design/color">
            Colors
          </Link>
          <Link className="text-sm font-medium text-body hover:text-brand" to="/design/component">
            Components
          </Link>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8 bg-canvas">
        <Outlet />
      </main>
    </div>
  )
}
