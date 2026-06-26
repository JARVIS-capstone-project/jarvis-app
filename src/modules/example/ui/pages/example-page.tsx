import { Button } from '@shared/ui/button'
import { ExampleList } from '@modules/example/ui/components/example-list'
import { useExamples } from '@modules/example/logic/hooks/use-examples'

export function ExamplePage() {
  const { data, loading, error, reload } = useExamples()

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Examples</h1>
        <Button variant="secondary" onClick={reload} disabled={loading}>
          {loading ? 'Loading…' : 'Reload'}
        </Button>
      </div>

      <p className="text-sm text-gray-500">
        Fetched from <code className="rounded bg-gray-100 px-1">/api/examples</code> through
        the Vite dev proxy — check your terminal for the proxy log line.
      </p>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error} — is your backend running on the proxy target?
        </div>
      )}

      <ExampleList items={data} />
    </section>
  )
}
