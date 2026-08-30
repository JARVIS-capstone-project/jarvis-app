import { useState } from 'react'
import { RefreshCw, Users } from 'lucide-react'
import { adminUsersService } from '@modules/admin/api/admin-users-service'
import { useEndpoint } from '@shared/model/use-endpoint'
import { PaginationBar } from '@modules/admin/ui/components/pagination-bar'
import { UserCard } from '@modules/admin/ui/components/user-card'
import { UserGridSkeleton } from '@modules/admin/ui/components/skeleton-shapes'
import { useCurrentUserId } from '@modules/auth/model/auth-store'
import { cn } from '@shared/lib/cn'

/**
 * `/admin/users` — the account roster, one card per user, with moderation
 * behind each card's "…" menu.
 *
 * A ban ends the target's sessions immediately, so the list refetches after
 * every mutation rather than patching the row in place: the authoritative
 * status (and the platform's own refusals) live server-side, and a stale
 * optimistic row here would be an admin acting on a fiction.
 */
const DEFAULT_PAGE_SIZE = 20

export function AdminUsersPage() {
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [page, setPage] = useState(0)
  const currentUserId = useCurrentUserId()

  const { data, error, loading, refetch } = useEndpoint(
    () => adminUsersService.list({ limit: pageSize, offset: page * pageSize }),
    [pageSize, page],
  )

  const users = data?.items ?? []
  const isFirstLoad = loading && data === null

  return (
    <section>
      <header className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg uppercase tracking-widest text-heading">
            Users
          </h2>
          <p className="text-xs text-muted">
            Platform accounts. Banning revokes every active session at once.
          </p>
        </div>
        <button
          type="button"
          onClick={refetch}
          disabled={loading}
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-divider bg-surface px-2.5 py-1 text-xs text-body transition-colors hover:bg-hover hover:text-heading disabled:cursor-wait disabled:opacity-50"
        >
          <RefreshCw className={cn('size-3', loading && 'animate-spin')} />
          Refresh
        </button>
      </header>

      <PaginationBar
        className="mb-3"
        pageSize={pageSize}
        page={page}
        itemsThisPage={users.length}
        total={data?.total ?? null}
        loading={loading}
        onPageSizeChange={(n) => {
          setPageSize(n)
          setPage(0)
        }}
        onPageChange={setPage}
      />

      {error && (
        <p className="rounded-md border border-danger/40 bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {isFirstLoad ? (
        <UserGridSkeleton count={6} />
      ) : users.length === 0 && !error ? (
        <EmptyRoster />
      ) : (
        <div
          className={cn(
            'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3',
            // A refetch keeps the old cards on screen; fading them marks the
            // list as stale without collapsing the layout under the cursor.
            loading && 'opacity-60',
          )}
        >
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              isSelf={user.id === currentUserId}
              onChanged={refetch}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function EmptyRoster() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-divider bg-panel px-4 py-12 text-center">
      <Users className="size-5 text-muted" />
      <p className="text-sm text-body">No users on this page</p>
      <p className="text-xs text-muted">Try an earlier page or a larger page size.</p>
    </div>
  )
}
