import { Link, Outlet } from 'react-router'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <nav className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-4">
          <span className="font-bold">Jarvis</span>
          <Link className="text-sm font-medium hover:text-blue-600" to="/">
            Home
          </Link>
          <Link className="text-sm font-medium hover:text-blue-600" to="/examples">
            Examples
          </Link>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
