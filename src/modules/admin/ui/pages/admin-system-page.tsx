import { useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { adminSystemService } from '@modules/admin/api/admin-system-service'
import { useEndpoint, type EndpointResult } from '@modules/admin/model/use-endpoint'
import { HealthLight } from '@modules/admin/ui/components/health-light'
import { SourceBadge, type Source } from '@modules/admin/ui/components/source-badge'
import {
  HealthCardSkeleton,
  MetricsTableSkeleton,
} from '@modules/admin/ui/components/skeleton-shapes'
import { cn } from '@shared/lib/cn'

/**
 * `/admin/system` — bento of two health cards (agent + platform) side by side,
 * followed by agent metrics counters + timers. Both health cards auto-refresh
 * every 15s. Metrics is manual (values move fast).
 *
 * Agent's `/health` is rich: db reachable, kb_files, kb_mode, version.
 * Platform's `/health` is minimal: `{status, timestamp}` — a plain LB probe.
 * Both cards use the same green/red HealthLight; info-tile density differs.
 */
export function AdminSystemPage() {
  const agentHealth = useEndpoint(() => adminSystemService.health())
  const platformHealth = useEndpoint(() => adminSystemService.platformHealth())
  const metrics = useEndpoint(() => adminSystemService.metrics())

  useEffect(() => {
    const id = setInterval(() => {
      agentHealth.refetch()
      platformHealth.refetch()
    }, 15_000)
    return () => clearInterval(id)
    // Only the refetch fns matter; the rest of the endpoint objects changing
    // shouldn't restart the interval.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentHealth.refetch, platformHealth.refetch])

  const isMetricsFirstLoad = metrics.loading && metrics.data === null

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <AgentHealthCard endpoint={agentHealth} />
      <PlatformHealthCard endpoint={platformHealth} />

      {/* Metrics: counters + timers, side by side. */}
      <BentoCard className="lg:col-span-2">
        <BentoHeader
          source="agent"
          title="Metrics — Counters"
          subtitle="/agent/metrics · admin"
          onRefresh={metrics.refetch}
          loading={metrics.loading}
        />
        {metrics.error ? (
          <ErrorPanel message={metrics.error} />
        ) : isMetricsFirstLoad ? (
          <MetricsTableSkeleton rows={6} />
        ) : (
          <CountersTable data={metrics.data as MetricsResponse | null} />
        )}
      </BentoCard>

      <BentoCard>
        <BentoHeader source="agent" title="Metrics — Timers" subtitle="avg latency per key" />
        {metrics.error ? (
          <ErrorPanel message={metrics.error} />
        ) : isMetricsFirstLoad ? (
          <MetricsTableSkeleton rows={4} />
        ) : (
          <TimersTable data={metrics.data as MetricsResponse | null} />
        )}
      </BentoCard>
    </div>
  )
}

interface AgentHealthResponse {
  status?: 'ok' | 'degraded'
  service?: string
  version?: string
  db?: boolean
  kb_mode?: string
  kb_files?: number
}

interface PlatformHealthResponse {
  status?: 'ok' | 'degraded'
  timestamp?: string
}

interface MetricsResponse {
  counters?: Record<string, number>
  timers?: Record<string, { count: number; avg_ms: number }>
}

/**
 * Agent card — col-span-2. Wider because it renders 4 info tiles alongside
 * the light.
 */
function AgentHealthCard({ endpoint }: { endpoint: EndpointResult<unknown> }) {
  const payload = endpoint.data as AgentHealthResponse | null
  const isFirstLoad = endpoint.loading && endpoint.data === null
  const state =
    endpoint.error || !payload || payload.status !== 'ok' ? 'degraded' : 'ok'
  const hint = endpoint.error
    ? 'Agent unreachable'
    : payload
      ? `${payload.service} · v${payload.version}`
      : 'Loading…'

  return (
    <BentoCard className="lg:col-span-2">
      <BentoHeader
        source="agent"
        title="Health — Agent"
        subtitle="/agent/health · public, auto-refresh 15s"
        onRefresh={endpoint.refetch}
        loading={endpoint.loading}
      />
      {isFirstLoad ? (
        <HealthCardSkeleton />
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-8">
          <HealthLight state={state} hint={hint} />
          {payload && (
            <div className="flex flex-wrap gap-2">
              <InfoTile
                label="Database"
                value={payload.db ? 'reachable' : 'unreachable'}
                tone={payload.db ? 'ok' : 'bad'}
              />
              <InfoTile
                label="KB files"
                value={String(payload.kb_files ?? '—')}
                tone="neutral"
              />
              <InfoTile
                label="KB mode"
                value={payload.kb_mode ?? '—'}
                tone="neutral"
              />
              <InfoTile
                label="Version"
                value={payload.version ?? '—'}
                tone="neutral"
              />
            </div>
          )}
        </div>
      )}
    </BentoCard>
  )
}

/**
 * Platform card — col-span-1. Compact because the endpoint returns just
 * `{status, timestamp}` — no deeper reachability signal.
 */
function PlatformHealthCard({ endpoint }: { endpoint: EndpointResult<unknown> }) {
  const payload = endpoint.data as PlatformHealthResponse | null
  const isFirstLoad = endpoint.loading && endpoint.data === null
  const state =
    endpoint.error || !payload || payload.status !== 'ok' ? 'degraded' : 'ok'
  const hint = endpoint.error
    ? 'Platform unreachable'
    : payload?.timestamp
      ? `probed ${relTime(payload.timestamp)}`
      : 'Loading…'

  return (
    <BentoCard>
      <BentoHeader
        source="platform"
        title="Health — Platform"
        subtitle="/health · public, auto-refresh 15s"
        onRefresh={endpoint.refetch}
        loading={endpoint.loading}
      />
      {isFirstLoad ? (
        <HealthCardSkeleton />
      ) : (
        <div className="mt-4">
          <HealthLight state={state} hint={hint} />
        </div>
      )}
    </BentoCard>
  )
}

function BentoCard({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <section
      className={cn(
        'flex flex-col rounded-xl border border-divider bg-panel p-4',
        className,
      )}
    >
      {children}
    </section>
  )
}

function BentoHeader({
  source,
  title,
  subtitle,
  onRefresh,
  loading,
}: {
  source: Source
  title: string
  subtitle: string
  onRefresh?: () => void
  loading?: boolean
}) {
  return (
    <header className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-sm uppercase tracking-widest text-heading">
            {title}
          </h2>
          <SourceBadge source={source} />
        </div>
        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted">
          {subtitle}
        </p>
      </div>
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-divider bg-surface px-2 py-1 text-xs text-body transition-colors hover:bg-hover hover:text-heading disabled:cursor-wait disabled:opacity-50"
        >
          <RefreshCw className={cn('size-3', loading && 'animate-spin')} />
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      )}
    </header>
  )
}

function InfoTile({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'ok' | 'bad' | 'neutral'
}) {
  const toneClass =
    tone === 'ok'
      ? 'border-success/40 text-success'
      : tone === 'bad'
        ? 'border-danger/40 text-danger'
        : 'border-divider text-body'
  return (
    <div className={cn('rounded-md border bg-surface px-3 py-2', toneClass)}>
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted">
        {label}
      </div>
      <div className="mt-0.5 font-mono text-sm">{value}</div>
    </div>
  )
}

function CountersTable({ data }: { data: MetricsResponse | null }) {
  const entries = Object.entries(data?.counters ?? {}).sort((a, b) =>
    a[0].localeCompare(b[0]),
  )
  if (entries.length === 0) {
    return (
      <div className="mt-3 rounded-md border border-dashed border-divider bg-surface px-3 py-6 text-center text-xs text-muted">
        No counters recorded yet.
      </div>
    )
  }
  return (
    <div className="mt-3 max-h-96 overflow-y-auto rounded-md border border-divider">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-surface text-left">
          <tr className="font-mono text-[10px] uppercase tracking-widest text-muted">
            <th className="px-3 py-1.5">Metric</th>
            <th className="px-3 py-1.5 text-right">Value</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([k, v]) => (
            <tr key={k} className="border-t border-divider">
              <td className="px-3 py-1.5 font-mono text-xs text-body">{k}</td>
              <td className="px-3 py-1.5 text-right font-mono tabular-nums text-heading">
                {v}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TimersTable({ data }: { data: MetricsResponse | null }) {
  const entries = Object.entries(data?.timers ?? {}).sort((a, b) =>
    a[0].localeCompare(b[0]),
  )
  if (entries.length === 0) {
    return (
      <div className="mt-3 rounded-md border border-dashed border-divider bg-surface px-3 py-6 text-center text-xs text-muted">
        No timers recorded yet.
      </div>
    )
  }
  return (
    <div className="mt-3 max-h-96 overflow-y-auto rounded-md border border-divider">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-surface text-left">
          <tr className="font-mono text-[10px] uppercase tracking-widest text-muted">
            <th className="px-3 py-1.5">Metric</th>
            <th className="px-3 py-1.5 text-right">Count</th>
            <th className="px-3 py-1.5 text-right">Avg ms</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([k, v]) => (
            <tr key={k} className="border-t border-divider">
              <td className="px-3 py-1.5 font-mono text-xs text-body">{k}</td>
              <td className="px-3 py-1.5 text-right font-mono tabular-nums text-heading">
                {v.count}
              </td>
              <td className="px-3 py-1.5 text-right font-mono tabular-nums text-heading">
                {v.avg_ms.toFixed(2)}
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

/**
 * Very compact relative time — "2m ago", "3h ago", "1d ago". Same helper
 * shape as the audit card's relTime; kept inline here to avoid dragging a
 * shared util across modules for a single call site.
 */
function relTime(iso: string): string {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return iso
  const secs = Math.max(0, (Date.now() - t) / 1000)
  if (secs < 60) return `${Math.round(secs)}s ago`
  if (secs < 3600) return `${Math.round(secs / 60)}m ago`
  if (secs < 86400) return `${Math.round(secs / 3600)}h ago`
  return `${Math.round(secs / 86400)}d ago`
}
