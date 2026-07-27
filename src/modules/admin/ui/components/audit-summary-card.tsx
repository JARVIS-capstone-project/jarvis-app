import { useMemo, useState } from 'react'
import { AlertTriangle, MessageSquare } from 'lucide-react'
import { LevelIndicator } from '@modules/admin/ui/components/level-indicator'
import { SourceBadge, type Source } from '@modules/admin/ui/components/source-badge'
import {
  normalizeTurns,
  type RawTurn,
} from '@modules/admin/model/use-session-aggregates'
import { cn } from '@shared/lib/cn'

/**
 * Occupies the featured bento slot. Shows aggregates over a rolling window
 * of recent turns from a single source: total escalations, avg severity,
 * turn count. Window options: today / 7 days / 30 days.
 *
 * The `payload` is expected to be a large-ish fetch (limit=200, the BE cap)
 * so the 7d/30d windows have enough headroom. If a section has more than 200
 * turns in the selected window, only the newest 200 are aggregated — the
 * subtitle labels this honestly so admins don't misread the number.
 */
type Window = 'today' | '7d' | '30d'

const WINDOW_LABEL: Record<Window, string> = {
  today: 'Today',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
}

const WINDOW_MS: Record<Window, number> = {
  today: 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
}

const SEV_NUMERIC: Record<'P1' | 'P2' | 'P3' | 'P4', number> = {
  P1: 4,
  P2: 3,
  P3: 2,
  P4: 1,
}

interface Props {
  source: Source
  payload: unknown
  loading: boolean
  className?: string
}

interface Aggregates {
  turnCount: number
  escalations: number
  avgSeverity: number | null
  sessionCount: number
}

function aggregate(turns: RawTurn[], window: Window): Aggregates {
  const now = Date.now()
  const cutoff = now - WINDOW_MS[window]
  let escalations = 0
  let sevSum = 0
  let sevCount = 0
  let turnCount = 0
  const sessions = new Set<string>()
  for (const t of turns) {
    if (!t.created_at) continue
    const ts = Date.parse(t.created_at)
    if (Number.isNaN(ts) || ts < cutoff) continue
    turnCount += 1
    if (t.session_id) sessions.add(t.session_id)
    if (t.requires_escalation) escalations += 1
    if (t.severity && t.severity in SEV_NUMERIC) {
      sevSum += SEV_NUMERIC[t.severity]
      sevCount += 1
    }
  }
  return {
    turnCount,
    escalations,
    avgSeverity: sevCount > 0 ? sevSum / sevCount : null,
    sessionCount: sessions.size,
  }
}

export function AuditSummaryCard({ source, payload, loading, className }: Props) {
  const [window, setWindow] = useState<Window>('today')
  const turns = useMemo(() => normalizeTurns(payload), [payload])
  const agg = useMemo(() => aggregate(turns, window), [turns, window])
  // Warn when the payload is at the BE cap AND covers a longer window — some
  // turns in the window may not be in `turns` at all.
  const atCap = turns.length >= 200 && window !== 'today'

  return (
    <article
      className={cn(
        'flex flex-col gap-4 rounded-xl border border-divider bg-panel p-4 md:col-span-2',
        loading && 'opacity-70',
        className,
      )}
    >
      <header className="flex items-start justify-between gap-2">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted">
            Overview
          </div>
          <div className="mt-0.5 font-display text-sm uppercase tracking-widest text-heading">
            {WINDOW_LABEL[window]}
          </div>
          <div className="mt-0.5 font-mono text-[10px] text-muted">
            {agg.sessionCount} session{agg.sessionCount === 1 ? '' : 's'} · {agg.turnCount} turn{agg.turnCount === 1 ? '' : 's'} in window
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <SourceBadge source={source} />
          <div className="flex overflow-hidden rounded-md border border-divider">
            {(Object.keys(WINDOW_LABEL) as Window[]).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWindow(w)}
                className={cn(
                  'px-2 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors',
                  w === window
                    ? 'bg-brand text-white'
                    : 'bg-surface text-body hover:bg-hover hover:text-heading',
                )}
              >
                {w === 'today' ? 'Today' : w}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatBlock
          label="Escalations"
          value={String(agg.escalations)}
          icon={<AlertTriangle className="size-3.5" />}
          tone={agg.escalations > 0 ? 'warning' : 'nominal'}
        />
        <SeverityStatBlock avgSeverity={agg.avgSeverity} />
        <StatBlock
          label="Turns"
          value={String(agg.turnCount)}
          icon={<MessageSquare className="size-3.5" />}
          tone="nominal"
        />
      </div>

      {atCap && (
        <p className="font-mono text-[10px] text-muted">
          Aggregating the 200 most recent turns. Older activity in this window is not counted.
        </p>
      )}
    </article>
  )
}

function StatBlock({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: string
  icon: React.ReactNode
  tone: 'nominal' | 'warning' | 'critical'
}) {
  const toneClass =
    tone === 'critical'
      ? 'text-danger'
      : tone === 'warning'
        ? 'text-warning'
        : 'text-heading'
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

function SeverityStatBlock({ avgSeverity }: { avgSeverity: number | null }) {
  return (
    <div className="rounded-md border border-divider bg-surface px-3 py-3">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted">
        Avg severity
      </div>
      {avgSeverity === null ? (
        <div className="mt-1 font-display text-3xl tabular-nums text-muted">—</div>
      ) : (
        <>
          <div className="mt-1 font-display text-3xl tabular-nums text-heading">
            Ø {avgSeverity.toFixed(2)}
          </div>
          <div className="mt-2">
            <LevelIndicator
              style="continuousCapacity"
              value={avgSeverity}
              min={0}
              max={4}
              warningValue={2.5}
              criticalValue={3.5}
              direction="above"
              showValue={false}
            />
          </div>
        </>
      )}
    </div>
  )
}
