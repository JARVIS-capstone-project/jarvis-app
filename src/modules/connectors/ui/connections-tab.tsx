import { useState } from 'react'
import {
  mcpConnectionsService,
  type CatalogEntry,
  type Connection,
  type ConnectionTestResult,
} from '@modules/connectors/api/mcp-connections-service'
import { ConnectionsListView } from '@modules/connectors/ui/views/connections-list-view'
import { ConnectionDetailView } from '@modules/connectors/ui/views/connection-detail-view'
import { McpBrowseView } from '@modules/connectors/ui/views/mcp-browse-view'
import { AddConnectionView } from '@modules/connectors/ui/views/add-connection-view'
import { useEndpoint } from '@shared/model/use-endpoint'
import { HttpApiError } from '@shared/api/http-client'
import { toast } from '@shared/model/toast-store'

/**
 * Connections settings tab — a master-detail stack in one pane.
 *
 * The settings modal gives this about 500×500px, which is too little to show
 * a list, a catalog and a form at once, so views replace each other and every
 * non-root one carries a back arrow. Navigation is a single discriminated
 * union rather than routes: nothing here is worth a URL, and the modal is
 * dismissed before anyone could deep-link into it.
 *
 * The connection list is the one piece of server state, refetched after every
 * mutation instead of patched locally — status is derived server-side from
 * credentials the client never sees, so an optimistic row would be a guess.
 */
type View =
  | { name: 'list' }
  | { name: 'detail'; id: string; initialResult?: ConnectionTestResult | null }
  | { name: 'browse' }
  | { name: 'add'; entry?: CatalogEntry }

export function ConnectionsTab() {
  const [view, setView] = useState<View>({ name: 'list' })

  const connections = useEndpoint(() => mcpConnectionsService.list(), [])
  // Fetched once when Browse is first opened, then cached for the tab's life:
  // the catalog is static and identical for every user.
  const catalog = useEndpoint(
    () =>
      view.name === 'browse'
        ? mcpConnectionsService.catalog()
        : Promise.resolve<CatalogEntry[] | null>(null),
    [view.name === 'browse'],
  )

  const toggle = async (conn: Connection, enabled: boolean) => {
    try {
      await mcpConnectionsService.update(conn.id, { enabled })
      connections.refetch()
    } catch (err) {
      const detail = err instanceof HttpApiError ? err.detail : null
      toast.danger(detail ?? `Could not update ${conn.name}`)
    }
  }

  if (view.name === 'browse') {
    return (
      <McpBrowseView
        entries={catalog.data ?? []}
        loading={catalog.loading}
        error={catalog.error}
        onBack={() => setView({ name: 'list' })}
        onPick={(entry) => setView({ name: 'add', entry })}
      />
    )
  }

  if (view.name === 'add') {
    return (
      <AddConnectionView
        entry={view.entry}
        onCancel={() => setView({ name: 'list' })}
        onAdded={(conn, testResult) => {
          connections.refetch()
          setView({ name: 'detail', id: conn.id, initialResult: testResult })
        }}
      />
    )
  }

  if (view.name === 'detail') {
    const conn = (connections.data ?? []).find((c) => c.id === view.id)
    // The row can vanish under us — another tab deleted it, or the refetch
    // after an add has not landed yet. Falling back to the list is honest;
    // a spinner would imply it is still coming.
    if (!conn) return <ListView />
    return (
      <ConnectionDetailView
        conn={conn}
        initialResult={view.initialResult}
        onBack={() => setView({ name: 'list' })}
        onChanged={connections.refetch}
        onDeleted={() => {
          connections.refetch()
          setView({ name: 'list' })
        }}
      />
    )
  }

  return <ListView />

  function ListView() {
    return (
      <ConnectionsListView
        connections={connections.data ?? []}
        loading={connections.loading}
        error={connections.error}
        onOpen={(id) => setView({ name: 'detail', id })}
        onToggle={toggle}
        onBrowse={() => setView({ name: 'browse' })}
        onAddCustom={() => setView({ name: 'add' })}
      />
    )
  }
}
