import { useState } from 'react'
import { RefreshCw, ShieldAlert, ShieldCheck } from 'lucide-react'
import {
  adminInjectionsService,
  type InjectionRange,
} from '@modules/admin/api/admin-audit-service'
import { InjectionDayChart } from '@modules/admin/ui/components/injection-day-chart'
import { InjectionFeed } from '@modules/admin/ui/components/injection-feed'
import { InjectionRollupPanels } from '@modules/admin/ui/components/injection-rollup-panels'
import { RangeFilter } from '@modules/admin/ui/components/range-filter'
import { SkeletonBar, SkeletonBlock } from '@modules/admin/ui/components/skeleton-shapes'
import { useEndpoint } from '@shared/model/use-endpoint'
import { cn } from '@shared/lib/cn'

/**
 * `/admin/detection` — turns where something tried to give the agent orders.
 *
 * Two halves, fed by two endpoints, answering two questions:
 *
 *   rollup (`/injections/summary`, windowed) — how much, and concentrated where
 *   feed   (`/audit?injection_only=true`,    — what actually happened, verbatim
 *           paginated, NOT windowed)
 *
 * The range filter drives only the rollup. `/admin/audit` has no `range` param,
 * and an empty window is the *normal* case here — attempts are rare, so "today"
 * would blank the feed most days. The two halves are therefore allowed to
 * disagree, and each says which window it is showing.
 *
 * The rollup's empty state must never swallow the feed for the same reason: a
 * quiet week does not mean there is nothing on file.
 *
 * Flags are observation, not punishment: a flagged turn is not blocked and does
 * not force escalation. Nothing here should read as an incident already handled.
 */
const RANGES = ['today', '7d', '30d'] as const

export function AdminDetectionPage() {
  const [range, setRange] = useState<InjectionRange>('7d')
  const [pattern, setPattern] = useState<string | null>(null)
  const { data, error, loading, refetch } = useEndpoint(
    () => adminInjectionsService.summary(range),
    [range],
  )

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg uppercase tracking-widest text-heading">
            Detection
          </h2>
          <p className="text-xs text-muted">
            Prompt-injection attempts — typed messages, tool results and attachments that
            tried to give the agent instructions.
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
        <p
          role="alert"
          className="rounded-md border border-danger/40 bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          {error}
        </p>
      )}

      {loading && !data ? (
        <RollupSkeleton />
      ) : data && data.total_turns > 0 ? (
        <>
          <section className="rounded-xl border border-divider bg-panel p-4">
            <div className="mb-3 flex items-baseline gap-2">
              <ShieldAlert className="size-4 shrink-0 self-center text-warning" />
              <span className="font-display text-2xl tabular-nums text-heading">
                {data.total_turns}
              </span>
              <span className="text-xs text-muted">
                flagged turn{data.total_turns === 1 ? '' : 's'} · {data.top_users.length} user
                {data.top_users.length === 1 ? '' : 's'} · {data.by_pattern.length} pattern
                {data.by_pattern.length === 1 ? '' : 's'}
              </span>
            </div>
            <InjectionDayChart since={data.since} days={data.by_day} />
          </section>

          <InjectionRollupPanels
            summary={data}
            activePattern={pattern}
            onPatternSelect={setPattern}
          />
        </>
      ) : data ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-divider bg-panel px-4 py-10 text-center">
          <ShieldCheck className="size-5 text-success" />
          <p className="text-sm text-body">No injection attempts in this window</p>
          <p className="text-xs text-muted">Try a wider range — the feed below is unfiltered.</p>
        </div>
      ) : null}

      {/* Remount on filter change: page 3 of the unfiltered feed is not page 3
          of a filtered one, and the feed owns its own paging state. */}
      <InjectionFeed
        key={pattern ?? 'all'}
        pattern={pattern ?? undefined}
        onClearPattern={() => setPattern(null)}
      />
    </section>
  )
}

function RollupSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-4">
      <div className="rounded-xl border border-divider bg-panel p-4">
        <SkeletonBar className="h-6 w-40" />
        <SkeletonBlock className="mt-3 h-24" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SkeletonBlock className="h-40" />
        <SkeletonBlock className="h-40" />
      </div>
    </div>
  )
}
