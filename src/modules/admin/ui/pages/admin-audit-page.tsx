import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { adminAuditService } from '@modules/admin/api/admin-audit-service'
import { useEndpoint } from '@modules/admin/model/use-endpoint'
import {
  normalizeTurns,
  aggregateSessions,
  type SessionSummary,
} from '@modules/admin/model/use-session-aggregates'
import { AuditSessionCard } from '@modules/admin/ui/components/audit-session-card'
import { AuditSummaryCard } from '@modules/admin/ui/components/audit-summary-card'
import { AuditBentoSkeleton } from '@modules/admin/ui/components/skeleton-shapes'
import { PaginationBar } from '@modules/admin/ui/components/pagination-bar'
import { cn } from '@shared/lib/cn'

/**
 * `/admin/audit` — single bento section over agent-system's turn audit.
 *   - First cell (col-span-2) is a SUMMARY CARD with time filter (today/7d/30d).
 *     Fetches its own recent window (limit=200) independent of pagination so
 *     paging the session cards never shuffles the summary numbers.
 *   - Remaining cells are paginated SESSION CARDS (aggregates only — no
 *     message-text previews per policy).
 *
 * Platform used to expose /api/admin/audit as a parallel source; that
 * endpoint was removed and the FE now calls agent directly. Login history
 * lives on /admin/system, not here.
 *
 * Pagination is at the RAW TURN level (BE contract). Sessions aggregated
 * client-side; sessions whose turns span a page boundary appear on both
 * pages with partial aggregates.
 */
const DEFAULT_PAGE_SIZE = 20
const SUMMARY_LIMIT = 200

export function AdminAuditPage() {
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [page, setPage] = useState(0)

  // Two independent fetches:
  //  1. Summary — a wide window (BE cap 200) for the overview card.
  //  2. Page — the current session-card grid.
  const summary = useEndpoint(() =>
    adminAuditService.turnsAgent({ limit: SUMMARY_LIMIT, offset: 0 }),
  )
  const page$ = useEndpoint(
    () => adminAuditService.turnsAgent({ limit: pageSize, offset: page * pageSize }),
    [pageSize, page],
  )

  const turns = normalizeTurns(page$.data)
  const sessions = aggregateSessions(turns)
  // Agent returns a bare array (no `total`); PaginationBar derives hasNext
  // from `itemsThisPage >= pageSize`.
  const isFirstLoad = page$.loading && page$.data === null
  const isReloading = page$.loading && page$.data !== null
  const refreshAll = () => {
    summary.refetch()
    page$.refetch()
  }

  return (
    <section>
      <header className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg uppercase tracking-widest text-heading">
            Agent System — Turn Audit
          </h2>
          <p className="text-xs text-muted">
            Real triage-turn rows from agent-system. Source of truth.
          </p>
        </div>
        <button
          type="button"
          onClick={refreshAll}
          disabled={summary.loading || page$.loading}
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-divider bg-surface px-2.5 py-1 text-xs text-body transition-colors hover:bg-hover hover:text-heading disabled:cursor-wait disabled:opacity-50"
        >
          <RefreshCw
            className={cn(
              'size-3',
              (summary.loading || page$.loading) && 'animate-spin',
            )}
          />
          {summary.loading || page$.loading ? 'Loading…' : 'Refresh'}
        </button>
      </header>

      {page$.error ? (
        <div
          role="alert"
          className="rounded-md border border-danger bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          {page$.error}
        </div>
      ) : isFirstLoad ? (
        <AuditBentoSkeleton />
      ) : (
        <SessionGrid
          sessions={sessions}
          summaryPayload={summary.data}
          summaryLoading={summary.loading}
          dim={isReloading}
        />
      )}

      <PaginationBar
        className="mt-3"
        pageSize={pageSize}
        page={page}
        itemsThisPage={turns.length}
        loading={page$.loading}
        onPageSizeChange={(n) => {
          setPageSize(n)
          setPage(0)
        }}
        onPageChange={setPage}
      />
    </section>
  )
}

function SessionGrid({
  sessions,
  summaryPayload,
  summaryLoading,
  dim,
}: {
  sessions: SessionSummary[]
  summaryPayload: unknown
  summaryLoading: boolean
  dim: boolean
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-3 md:grid-cols-2 md:auto-rows-fr lg:grid-cols-4',
        dim && 'opacity-60 transition-opacity',
      )}
    >
      <AuditSummaryCard
        source="agent"
        payload={summaryPayload}
        loading={summaryLoading}
      />
      {sessions.map((s) => (
        <AuditSessionCard key={s.sessionId} session={s} source="agent" />
      ))}
    </div>
  )
}
