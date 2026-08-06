import { useMemo, useState } from 'react'
import { RefreshCw, ShieldAlert, Users } from 'lucide-react'
import { adminAuditService } from '@modules/admin/api/admin-audit-service'
import { useEndpoint } from '@modules/admin/model/use-endpoint'
import { SourceBadge } from '@modules/admin/ui/components/source-badge'
import { MetricsTableSkeleton } from '@modules/admin/ui/components/skeleton-shapes'
import { cn } from '@shared/lib/cn'

/**
 * Two-card bento section on `/admin/system`:
 *   - Left card (col-span-1):  stats stacked vertically — total logins,
 *                              unique IPs, failure count. Header holds the
 *                              time-window filter and Refresh.
 *   - Right card (col-span-2): IP breakdown table.
 *
 * Both derive from the SAME fetch + window state, held here so the two
 * cards stay in sync. Returned as a fragment so the parent's grid places
 * them as siblings, keeping their bento position clean.
 *
 * Time filter is client-side (BE has no time-range param yet). We fetch
 * `limit=50` and filter `attempted_at` locally.
 */
const FETCH_LIMIT = 50

type Window = 'today' | '7d' | '30d' | 'year' | 'all'

const WINDOW_LABEL: Record<Window, string> = {
  today: 'Today',
  '7d': '7 days',
  '30d': '30 days',
  year: '1 year',
  all: 'All',
}

const WINDOW_MS: Record<Window, number | null> = {
  today: 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  year: 365 * 24 * 60 * 60 * 1000,
  all: null,
}

interface LoginRow {
  email?: string
  ip?: string
  success?: boolean
  failure_reason?: string | null
  attempted_at?: string
}

interface Envelope {
  items?: LoginRow[]
  total?: number
}

function extractItems(payload: unknown): LoginRow[] {
  if (!payload || typeof payload !== 'object') return []
  const env = payload as Envelope
  return Array.isArray(env.items) ? env.items : []
}

function filterByWindow(items: LoginRow[], window: Window): LoginRow[] {
  const ms = WINDOW_MS[window]
  if (ms === null) return items
  const cutoff = Date.now() - ms
  return items.filter((r) => {
    if (!r.attempted_at) return false
    const t = Date.parse(r.attempted_at)
    return !Number.isNaN(t) && t >= cutoff
  })
}

interface Aggregates {
  total: number
  uniqueIps: number
  failures: number
  byIp: { ip: string; count: number; failures: number }[]
}

function aggregate(items: LoginRow[]): Aggregates {
  const byIp = new Map<string, { ip: string; count: number; failures: number }>()
  let failures = 0
  for (const r of items) {
    const ip = r.ip ?? '(unknown)'
    let bucket = byIp.get(ip)
    if (!bucket) {
      bucket = { ip, count: 0, failures: 0 }
      byIp.set(ip, bucket)
    }
    bucket.count += 1
    if (r.success === false) {
      bucket.failures += 1
      failures += 1
    }
  }
  return {
    total: items.length,
    uniqueIps: byIp.size,
    failures,
    byIp: Array.from(byIp.values()).sort((a, b) => b.count - a.count),
  }
}

export function LoginHistoryCard() {
  const [window, setWindow] = useState<Window>('today')
  const endpoint = useEndpoint(() =>
    adminAuditService.logins({ limit: FETCH_LIMIT, offset: 0 }),
  )
  const items = useMemo(() => extractItems(endpoint.data), [endpoint.data])
  const filtered = useMemo(() => filterByWindow(items, window), [items, window])
  const agg = useMemo(() => aggregate(filtered), [filtered])
  const totalRaw: number | null =
    endpoint.data &&
    typeof endpoint.data === 'object' &&
    typeof (endpoint.data as Envelope).total === 'number'
      ? ((endpoint.data as Envelope).total as number)
      : null

  const isFirstLoad = endpoint.loading && endpoint.data === null

  return (
    <>
      <LoginStatsCard
        window={window}
        onWindowChange={setWindow}
        onRefresh={endpoint.refetch}
        loading={endpoint.loading}
        error={endpoint.error}
        isFirstLoad={isFirstLoad}
        aggregates={agg}
        totalOnRecord={totalRaw}
      />
      <IpBreakdownCard
        aggregates={agg}
        isFirstLoad={isFirstLoad}
        error={endpoint.error}
      />
    </>
  )
}

interface StatsProps {
  window: Window
  onWindowChange: (w: Window) => void
  onRefresh: () => void
  loading: boolean
  error: string | null
  isFirstLoad: boolean
  aggregates: Aggregates
  totalOnRecord: number | null
}

function LoginStatsCard({
  window,
  onWindowChange,
  onRefresh,
  loading,
  error,
  isFirstLoad,
  aggregates,
  totalOnRecord,
}: StatsProps) {
  return (
    <section className="flex flex-col rounded-xl border border-divider bg-panel p-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-sm uppercase tracking-widest text-heading">
              Login History
            </h2>
            <SourceBadge source="platform" />
          </div>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted">
            /api/admin/audit/logins · last {FETCH_LIMIT}
            {typeof totalOnRecord === 'number' && ` (of ${totalOnRecord} on record)`}
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-divider bg-surface px-2 py-1 text-xs text-body transition-colors hover:bg-hover hover:text-heading disabled:cursor-wait disabled:opacity-50"
        >
          <RefreshCw className={cn('size-3', loading && 'animate-spin')} />
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </header>

      <div className="mt-3 flex flex-wrap gap-1 self-start overflow-hidden rounded-md border border-divider">
        {(Object.keys(WINDOW_LABEL) as Window[]).map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => onWindowChange(w)}
            className={cn(
              'px-2 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors',
              w === window
                ? 'bg-brand text-white'
                : 'bg-surface text-body hover:bg-hover hover:text-heading',
            )}
          >
            {WINDOW_LABEL[w]}
          </button>
        ))}
      </div>

      <p className="mt-2 font-mono text-[10px] text-muted">
        ⓘ Client-side filter over the last {FETCH_LIMIT} attempts. BE time-range
        param pending.
      </p>

      {error ? (
        <ErrorPanel message={error} />
      ) : isFirstLoad ? (
        <div className="mt-3 grid grid-cols-1 gap-3">
          <SkeletonStat />
          <SkeletonStat />
          <SkeletonStat />
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-3">
          <StatBlock label="Total logins" value={String(aggregates.total)} />
          <StatBlock
            label="Unique IPs"
            value={String(aggregates.uniqueIps)}
            icon={<Users className="size-3.5" />}
          />
          <StatBlock
            label="Failures"
            value={String(aggregates.failures)}
            tone={aggregates.failures > 0 ? 'critical' : 'nominal'}
            icon={<ShieldAlert className="size-3.5" />}
          />
        </div>
      )}
    </section>
  )
}

interface IpProps {
  aggregates: Aggregates
  isFirstLoad: boolean
  error: string | null
}

function IpBreakdownCard({ aggregates, isFirstLoad, error }: IpProps) {
  return (
    <section className="flex flex-col rounded-xl border border-divider bg-panel p-4 lg:col-span-2">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-sm uppercase tracking-widest text-heading">
              IP Breakdown
            </h2>
            <SourceBadge source="platform" />
          </div>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted">
            grouped by IP · sorted by attempt count
          </p>
        </div>
      </header>

      {error ? (
        <ErrorPanel message={error} />
      ) : isFirstLoad ? (
        <MetricsTableSkeleton rows={4} />
      ) : (
        <IpTable rows={aggregates.byIp} />
      )}
    </section>
  )
}

function StatBlock({
  label,
  value,
  icon,
  tone = 'nominal',
}: {
  label: string
  value: string
  icon?: React.ReactNode
  tone?: 'nominal' | 'critical'
}) {
  const toneClass = tone === 'critical' ? 'text-danger' : 'text-heading'
  return (
    <div className="rounded-md border border-divider bg-surface px-3 py-3">
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
        {icon}
        {label}
      </div>
      <div className={cn('mt-1 font-display text-3xl tabular-nums', toneClass)}>
        {value}
      </div>
    </div>
  )
}

function SkeletonStat() {
  return (
    <div className="rounded-md border border-divider bg-surface px-3 py-3">
      <div className="mb-2 h-2 w-20 animate-pulse rounded-sm bg-divider" />
      <div className="h-8 w-16 animate-pulse rounded-sm bg-divider" />
    </div>
  )
}

function IpTable({
  rows,
}: {
  rows: { ip: string; count: number; failures: number }[]
}) {
  if (rows.length === 0) {
    return (
      <div className="mt-3 rounded-md border border-dashed border-divider bg-surface px-3 py-6 text-center text-xs text-muted">
        No logins in this window.
      </div>
    )
  }
  return (
    <div className="mt-3 max-h-96 overflow-y-auto rounded-md border border-divider">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-surface text-left">
          <tr className="font-mono text-[10px] uppercase tracking-widest text-muted">
            <th className="px-3 py-1.5">IP</th>
            <th className="px-3 py-1.5 text-right">Logins</th>
            <th className="px-3 py-1.5 text-right">Failures</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.ip} className="border-t border-divider">
              <td className="px-3 py-1.5 font-mono text-xs text-body">{r.ip}</td>
              <td className="px-3 py-1.5 text-right font-mono tabular-nums text-heading">
                {r.count}
              </td>
              <td
                className={cn(
                  'px-3 py-1.5 text-right font-mono tabular-nums',
                  r.failures > 0 ? 'text-danger' : 'text-muted',
                )}
              >
                {r.failures}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mt-3 rounded-md border border-danger bg-danger-soft px-3 py-2 text-sm text-danger"
    >
      {message}
    </div>
  )
}
