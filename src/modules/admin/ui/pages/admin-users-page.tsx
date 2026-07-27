import { useState } from 'react'
import { adminUsersService } from '@modules/admin/api/admin-users-service'
import { useEndpoint } from '@modules/admin/model/use-endpoint'
import { EndpointBlock } from '@modules/admin/ui/components/endpoint-block'

const PAGE_SIZE = 20

/**
 * `/admin/users` — dumps `GET /api/admin/users` verbatim. Prev/Next only
 * changes the offset; no table rendering until the real UI phase.
 */
export function AdminUsersPage() {
  const [offset, setOffset] = useState(0)
  const { data, error, loading, refetch } = useEndpoint(
    () => adminUsersService.list({ limit: PAGE_SIZE, offset }),
    [offset],
  )

  return (
    <div>
      <EndpointBlock
        method="GET"
        path={`/api/admin/users?limit=${PAGE_SIZE}&offset=${offset}`}
        data={data}
        error={error}
        loading={loading}
        onRefresh={refetch}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
          disabled={offset === 0 || loading}
          className="rounded-md border border-divider px-3 py-1 text-sm text-body transition-colors hover:bg-hover hover:text-heading disabled:cursor-not-allowed disabled:opacity-50"
        >
          Prev
        </button>
        <button
          type="button"
          onClick={() => setOffset((o) => o + PAGE_SIZE)}
          disabled={loading}
          className="rounded-md border border-divider px-3 py-1 text-sm text-body transition-colors hover:bg-hover hover:text-heading disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
        <span className="ml-2 self-center text-xs text-muted">offset = {offset}</span>
      </div>
    </div>
  )
}
