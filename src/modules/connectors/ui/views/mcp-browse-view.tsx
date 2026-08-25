import { useMemo, useState } from 'react'
import { Check, Search, ShieldAlert } from 'lucide-react'
import type {
  CatalogEntry,
  Connection,
} from '@modules/connectors/api/mcp-connections-service'
import { BackHeader } from '@modules/connectors/ui/components/back-header'
import { McpLogo } from '@shared/ui/mcp-logo'
import { Badge } from '@shared/ui/badge'
import { Input } from '@shared/ui/input'

/**
 * The servers this deployment suggests — `GET /mcp/catalog`, which is static,
 * identical for every user, and connected to nothing until one is added.
 *
 * Filtering is client-side: the list is eight rows and the endpoint takes no
 * query, so a round trip per keystroke would buy nothing.
 */
interface Props {
  entries: CatalogEntry[]
  /**
   * What the user already has, so a card can say "connected" instead of offering a
   * second copy. The platform does not reject a duplicate, so this is the only thing
   * standing between one click too many and two Jira rows.
   */
  connections: Connection[]
  loading: boolean
  error: string | null
  onBack: () => void
  onPick: (entry: CatalogEntry) => void
  onOpen: (id: string) => void
}

export function McpBrowseView({
  entries,
  connections,
  loading,
  error,
  onBack,
  onPick,
  onOpen,
}: Props) {
  const [query, setQuery] = useState('')

  const existingByCatalogId = useMemo(
    () => new Map(connections.map((c) => [c.catalog_id, c])),
    [connections],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return entries
    return entries.filter(
      (e) =>
        e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q),
    )
  }, [entries, query])

  return (
    <div className="flex flex-col gap-4">
      <BackHeader onBack={onBack}>Browse MCPs</BackHeader>

      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search servers…"
          className="pl-8"
        />
      </div>

      {error && (
        <p className="rounded-md border border-danger/40 bg-danger-soft px-2.5 py-2 text-xs text-danger">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-xs text-muted">Loading catalog…</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-divider px-3 py-8 text-center text-xs text-muted">
          Nothing matches “{query}”.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {filtered.map((entry) => {
            const existing = existingByCatalogId.get(entry.id)
            return (
            <button
              key={entry.id}
              type="button"
              onClick={() => (existing ? onOpen(existing.id) : onPick(entry))}
              className="flex flex-col gap-2 rounded-lg border border-divider bg-panel p-3 text-left transition-colors hover:bg-hover"
            >
              <span className="flex items-center gap-2">
                <McpLogo catalogId={entry.id} />
                <span className="min-w-0 flex-1 truncate text-sm text-heading">
                  {entry.name}
                </span>
              </span>
              <span className="line-clamp-2 text-xs text-muted">{entry.description}</span>
              <span className="mt-auto flex flex-wrap gap-1">
                {existing ? (
                  existing.status === 'connected' ? (
                    <Badge variant="success" leftIcon={<Check className="size-3" />}>
                      connected
                    </Badge>
                  ) : (
                    <Badge variant="warning">not signed in</Badge>
                  )
                ) : (
                  entry.requires_login && <Badge variant="neutral">sign-in</Badge>
                )}
                {!entry.trusted && (
                  <Badge variant="warning" leftIcon={<ShieldAlert className="size-3" />}>
                    untrusted
                  </Badge>
                )}
              </span>
            </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
