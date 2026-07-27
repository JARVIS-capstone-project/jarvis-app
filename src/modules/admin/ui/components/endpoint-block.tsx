import type { ReactNode } from 'react'
import { JsonDump } from '@modules/admin/ui/components/json-dump'

/**
 * Shared "just fetch and dump" panel. Renders the endpoint + verb, a Refresh
 * button, and either a spinner / error / JSON dump depending on state.
 * Pages that need custom controls (pagination, PUT form) render children
 * BELOW the dump.
 */
interface Props {
  method: 'GET' | 'PUT' | 'POST'
  path: string
  data: unknown
  error: string | null
  loading: boolean
  onRefresh?: () => void
  children?: ReactNode
}

export function EndpointBlock({
  method,
  path,
  data,
  error,
  loading,
  onRefresh,
  children,
}: Props) {
  return (
    <section className="mb-6">
      <div className="mb-2 flex items-center gap-3">
        <span className="rounded bg-surface px-2 py-0.5 font-mono text-xs uppercase text-heading">
          {method}
        </span>
        <code className="font-mono text-sm text-body">{path}</code>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="ml-auto rounded-md border border-divider px-2 py-1 text-xs text-body transition-colors hover:bg-hover hover:text-heading disabled:cursor-wait disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        )}
      </div>
      {error ? (
        <div
          role="alert"
          className="rounded-md border border-danger bg-danger/10 px-3 py-2 text-sm text-danger"
        >
          {error}
        </div>
      ) : loading && data === null ? (
        <div className="rounded-md border border-divider bg-surface px-3 py-2 text-sm text-muted">
          Loading…
        </div>
      ) : (
        <JsonDump data={data} />
      )}
      {children}
    </section>
  )
}
