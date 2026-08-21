import { useState } from 'react'
import { ShieldCheck, X } from 'lucide-react'
import {
  adminAuditService,
  type AuditRow,
} from '@modules/admin/api/admin-audit-service'
import { InjectionCard } from '@modules/admin/ui/components/injection-card'
import { PaginationBar } from '@modules/admin/ui/components/pagination-bar'
import { SkeletonBlock } from '@modules/admin/ui/components/skeleton-shapes'
import { typedByUser } from '@modules/admin/model/injection-origin'
import { patternLabel } from '@modules/admin/model/injection-patterns'
import { useEndpoint } from '@shared/model/use-endpoint'

/**
 * Paginated feed of flagged turns. Owns its own fetch so the detection
 * dashboard and a single account page each mount it with one prop.
 *
 * Deliberately NOT wired to the dashboard's range filter. `/admin/audit` has no
 * `range` param, and narrowing to "today" would usually empty the feed —
 * injection attempts are rare, so a quiet day is the normal case, not a
 * finding. The rollup above answers "how much, in this window"; the feed
 * answers "what happened most recently", and those are different questions.
 *
 * The two sections group the CURRENT PAGE, not the whole trail — which is why
 * neither carries a count. The pagination bar owns the numbers, so a section
 * heading can never imply a total it does not know.
 *
 * Callers changing `pattern` should remount via `key` rather than expect an
 * internal reset: page 3 of an unfiltered feed is not page 3 of a filtered one.
 */
interface Props {
  /** Scope to one account — the ban-evidence view. */
  userId?: string
  /** Scanner label filter, straight from the rollup's What panel. */
  pattern?: string
  onClearPattern?: () => void
  /** Off when the page is already scoped to one account. */
  showUser?: boolean
}

export function InjectionFeed({ userId, pattern, onClearPattern, showUser = true }: Props) {
  const [pageSize, setPageSize] = useState(20)
  const [page, setPage] = useState(0)

  const { data, error, loading } = useEndpoint(
    () =>
      adminAuditService.turnsAgent({
        limit: pageSize,
        offset: page * pageSize,
        injectionOnly: true,
        pattern,
        userId,
      }),
    [pageSize, page, pattern, userId],
  )

  const rows = Array.isArray(data) ? data : []
  const typed = rows.filter(typedByUser)
  const read = rows.filter((r) => !typedByUser(r))
  const isFirstLoad = loading && data === null

  return (
    <section className="rounded-xl border border-divider bg-panel p-4">
      <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="font-display text-sm uppercase tracking-widest text-heading">
            Recent attempts
          </h3>
          <p className="mt-0.5 text-xs text-muted">
            Newest first, across all time — not narrowed by the range filter above.
          </p>
        </div>
        {pattern && (
          <button
            type="button"
            onClick={onClearPattern}
            className="flex items-center gap-1 rounded-md border border-divider bg-surface px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-body transition-colors hover:bg-hover hover:text-heading"
          >
            {patternLabel(pattern)}
            <X className="size-3" />
          </button>
        )}
      </header>

      {error ? (
        <p
          role="alert"
          className="rounded-md border border-danger/40 bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          {error}
        </p>
      ) : isFirstLoad ? (
        <div aria-hidden className="flex flex-col gap-2">
          <SkeletonBlock className="h-24" />
          <SkeletonBlock className="h-24" />
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-divider px-4 py-10 text-center">
          <ShieldCheck className="size-5 text-success" />
          <p className="text-sm text-body">
            {pattern ? `No turns matched ${patternLabel(pattern)}` : 'No injection attempts recorded'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <FeedGroup
            title="Typed by user"
            hint="The account wrote this. This is the evidence a ban rests on."
            rows={typed}
            showUser={showUser}
          />
          <FeedGroup
            title="From content they read"
            hint="A tool result or attachment carried it. The account was targeted, not the author."
            rows={read}
            showUser={showUser}
          />
        </div>
      )}

      {rows.length > 0 && (
        <PaginationBar
          className="mt-3"
          pageSize={pageSize}
          page={page}
          itemsThisPage={rows.length}
          loading={loading}
          onPageSizeChange={(n) => {
            setPageSize(n)
            setPage(0)
          }}
          onPageChange={setPage}
        />
      )}
    </section>
  )
}

function FeedGroup({
  title,
  hint,
  rows,
  showUser,
}: {
  title: string
  hint: string
  rows: AuditRow[]
  showUser: boolean
}) {
  if (rows.length === 0) return null
  return (
    <div>
      <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted">{title}</h4>
      <p className="mb-2 mt-0.5 text-xs text-muted">{hint}</p>
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2 2xl:grid-cols-3">
        {rows.map((row) => (
          <InjectionCard key={row.trace_id} row={row} showUser={showUser} />
        ))}
      </div>
    </div>
  )
}
