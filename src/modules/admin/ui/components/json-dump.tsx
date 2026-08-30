/**
 * Debug-style pretty-printer. Used across the admin surface as a "just show
 * me the API response" affordance while the real UI is deferred. Wraps long
 * lines and scrolls on overflow so a big response can't blow out the layout.
 */
interface Props {
  data: unknown
  label?: string
}

export function JsonDump({ data, label }: Props) {
  return (
    <div className="rounded-md border border-divider bg-surface p-3">
      {label && (
        <div className="mb-2 text-xs font-mono uppercase tracking-widest text-muted">
          {label}
        </div>
      )}
      <pre className="max-h-[60vh] overflow-auto text-xs text-body">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}
