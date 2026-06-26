import { Link } from 'react-router'
import { Button } from '@shared/ui/button'

export function HomePage() {
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold">Jarvis App</h1>
      <p className="max-w-prose text-gray-600">
        A modular Vite + React + Tailwind scaffold. Each feature lives under{' '}
        <code className="rounded bg-gray-100 px-1">src/modules/*</code> with its UI and
        logic kept in separate folders.
      </p>
      <Link to="/examples">
        <Button>View examples →</Button>
      </Link>
    </section>
  )
}
