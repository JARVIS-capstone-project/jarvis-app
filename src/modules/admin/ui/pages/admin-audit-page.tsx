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
import type { Source } from '@modules/admin/ui/components/source-badge'
import { cn } from '@shared/lib/cn'

/**
 * `/admin/audit` — two sections (agent + platform). Each section is a bento:
 *   - First cell (col-span-2) is a SUMMARY CARD with time filter (today/7d/30d).
 *     It fetches its own recent window (limit=200) so paging session cards
 *     never shuffles the summary numbers.
 *   - Remaining cells are paginated SESSION CARDS (no text previews — preview
 *     policy is aggregates only).
 *
 * Pagination is at the RAW TURN level (BE contract). Sessions aggregated
 * client-side; sessions whose turns span a page boundary appear on both
 * pages with partial aggregates. Fixable with a BE session-level endpoint.
 */
const DEFAULT_PAGE_SIZE = 20
const SUMMARY_LIMIT = 200

export function AdminAuditPage() {
  return (
    <div className="space-y-8">
      <BentoSection
        title="Agent System — Turn Audit"
        subtitle="Real triage-turn rows from agent-system. Source of truth."
        source="agent"
        fetcher={(p) => adminAuditService.turnsAgent(p)}
      />
      <BentoSection
        title="Platform System — Turn Audit"
        subtitle="Platform mirror. MOCK data today (MockAuditQueryClient); real transport arrives with PLAT-7."
        source="platform"
        fetcher={(p) => adminAuditService.turnsPlatform(p)}
      />
    </div>
  )
}

interface SectionProps {
  title: string
  subtitle: string
  source: Source
  fetcher: (params: { limit: number; offset: number }) => Promise<unknown>
}

function BentoSection({ title, subtitle, source, fetcher }: SectionProps) {
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [page, setPage] = useState(0)

  // Two independent fetches:
  //  1. Summary — a wide window (BE cap 200) for the overview card. Not
  //     affected by pagination.
  //  2. Page — the current session-card grid.
  const summary = useEndpoint(() => fetcher({ limit: SUMMARY_LIMIT, offset: 0 }))
  const page$ = useEndpoint(
    () => fetcher({ limit: pageSize, offset: page * pageSize }),
    [pageSize, page],
  )

  const turns = normalizeTurns(page$.data)
  const sessions = aggregateSessions(turns)
  const totalTurns =
    page$.data &&
    typeof page$.data === 'object' &&
    typeof (page$.data as { total?: unknown }).total === 'number'
      ? ((page$.data as { total: number }).total)
      : null

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
            {title}
          </h2>
          <p className="text-xs text-muted">{subtitle}</p>
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
          source={source}
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
        total={totalTurns}
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
  source,
  summaryPayload,
  summaryLoading,
  dim,
}: {
  sessions: SessionSummary[]
  source: Source
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
        source={source}
        payload={summaryPayload}
        loading={summaryLoading}
      />
      {sessions.length === 0
        ? null
        : sessions.map((s) => (
            <AuditSessionCard key={s.sessionId} session={s} source={source} />
          ))}
    </div>
  )
}
