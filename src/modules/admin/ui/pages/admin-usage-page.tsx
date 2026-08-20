import { useState } from 'react'
import { Info, RefreshCw } from 'lucide-react'
import {
  adminUsageService,
  type UsageRange,
} from '@modules/admin/api/admin-usage-service'
import { TokenUsageBars } from '@modules/admin/ui/components/token-usage-bars'
import { formatTokens } from '@modules/admin/model/format-number'
import { RangeFilter } from '@modules/admin/ui/components/range-filter'
import { SkeletonBar, SkeletonBlock } from '@modules/admin/ui/components/skeleton-shapes'
import { useEndpoint } from '@shared/model/use-endpoint'
import { cn } from '@shared/lib/cn'

/**
 * `/admin/usage` — deployment-wide LLM token consumption.
 *
 * Framed as consumption, never as a quota. `modules/usage` states twice that
 * it is report-only with no cap or ceiling anywhere in the path, so a
 * progress bar or a "% used" figure here would be inventing a limit and
 * inviting someone to act on it. The notice says so in the UI rather than
 * only in this comment.
 */
const RANGES = ['today', '7d', '30d'] as const

export function AdminUsagePage() {
  const [range, setRange] = useState<UsageRange>('7d')
  const { data, error, loading, refetch } = useEndpoint(
    () => adminUsageService.overview(range),
    [range],
  )

  const totals = data?.totals
  const avgPerCall =
    totals && totals.calls > 0 ? Math.round(totals.total_tokens / totals.calls) : null

  return (
    <section>
      <header className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg uppercase tracking-widest text-heading">
            LLM Usage
          </h2>
          <p className="text-xs text-muted">
            Token consumption across the whole deployment — one API key, every user.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <RangeFilter options={RANGES} value={range} onChange={setRange} disabled={loading} />
          <button
            type="button"
            onClick={refetch}
            disabled={loading}
            aria-label="Refresh"
            className="flex size-7 items-center justify-center rounded-md border border-divider bg-surface text-body transition-colors hover:bg-hover hover:text-heading disabled:cursor-wait disabled:opacity-50"
          >
            <RefreshCw className={cn('size-3', loading && 'animate-spin')} />
          </button>
        </div>
      </header>

      {error && (
        <p className="mb-3 rounded-md border border-danger/40 bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {loading && !data ? (
        <UsageSkeleton />
      ) : totals ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatTile label="Total tokens" value={formatTokens(totals.total_tokens)} />
            <StatTile label="Model calls" value={totals.calls.toLocaleString()} />
            <StatTile
              label="Avg per call"
              value={avgPerCall === null ? '—' : formatTokens(avgPerCall)}
            />
          </div>

          <section className="rounded-xl border border-divider bg-panel p-4">
            <h3 className="mb-3 font-display text-sm uppercase tracking-widest text-heading">
              Breakdown
            </h3>
            <TokenUsageBars totals={totals} />
          </section>

          <p className="flex items-start gap-2 rounded-md border border-divider bg-surface px-2.5 py-2 text-xs text-muted">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            <span>
              Report-only. This deployment has no configured token cap, and nothing on
              this path throttles or blocks a turn — these are counts, not a quota.
            </span>
          </p>
        </div>
      ) : null}
    </section>
  )
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-divider bg-panel p-4">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted">
        {label}
      </div>
      <div className="mt-1 font-display text-2xl tabular-nums text-heading">{value}</div>
    </div>
  )
}

function UsageSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-divider bg-panel p-4">
            <SkeletonBar className="h-2 w-20" />
            <SkeletonBar className="mt-2 h-6 w-24" />
          </div>
        ))}
      </div>
      <SkeletonBlock className="h-56" />
    </div>
  )
}
