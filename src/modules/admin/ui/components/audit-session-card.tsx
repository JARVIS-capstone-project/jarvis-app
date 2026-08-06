import { AlertTriangle, MessageSquare } from 'lucide-react'
import { LevelIndicator } from '@modules/admin/ui/components/level-indicator'
import { SourceBadge, type Source } from '@modules/admin/ui/components/source-badge'
import type { SessionSummary } from '@modules/admin/model/use-session-aggregates'
import { cn } from '@shared/lib/cn'

/**
 * One bento cell — a session PREVIEW. Renders only aggregates, no message
 * text: session id short-hash, turn count, relative time, source badge,
 * escalation flag, severity + confidence meters.
 *
 * We deliberately do NOT render `user_message_preview` or `response_preview`
 * here — those carry snippets of banking-incident conversation and the admin
 * audit surface has no need to display them per the current policy. The BE
 * still truncates + PII-redacts on write, so if we ever want to reintroduce
 * text it's already safe; today we just show none.
 */
interface Props {
  session: SessionSummary
  source: Source
  className?: string
}

export function AuditSessionCard({ session, source, className }: Props) {
  const sessionShort = session.sessionId.slice(0, 8)
  const timeHint = session.newestAt ? relTime(session.newestAt) : ''

  return (
    <article
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-divider bg-panel p-4 transition-colors hover:bg-hover',
        className,
      )}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-3.5 text-muted" />
            <code className="font-mono text-xs text-muted">
              session {sessionShort}
            </code>
          </div>
          <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted">
            {session.turnCount} turn{session.turnCount === 1 ? '' : 's'} · {timeHint}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <SourceBadge source={source} />
          {session.anyEscalation && (
            <span
              className="inline-flex items-center gap-1 rounded-sm border border-warning/40 bg-warning-soft px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-warning"
              title="At least one turn required escalation"
            >
              <AlertTriangle className="size-2.5" /> escalation
            </span>
          )}
        </div>
      </header>

      <div className="mt-auto flex flex-col gap-3">
        {session.avgSeverity !== null ? (
          <LevelIndicator
            style="discreteCapacity"
            segments={4}
            value={session.avgSeverity}
            min={0}
            max={4}
            warningValue={2.5}
            criticalValue={3.5}
            direction="above"
            label={`sev · ${session.worstSeverity ?? '—'}`}
            formatValue={(v) => `Ø ${v.toFixed(1)}`}
          />
        ) : (
          <MutedMeter label="sev · —" />
        )}
        {session.avgConfidence !== null ? (
          <LevelIndicator
            style="continuousCapacity"
            value={session.avgConfidence}
            min={0}
            max={1}
            warningValue={0.7}
            criticalValue={0.5}
            direction="below"
            label="confidence"
            formatValue={(v) => `${(v * 100).toFixed(0)}%`}
          />
        ) : (
          <MutedMeter label="confidence" />
        )}
      </div>
    </article>
  )
}

function MutedMeter({ label }: { label: string }) {
  return (
    <div>
      <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted">
        {label}
      </div>
      <div className="h-2 w-full rounded-sm border border-divider bg-surface" />
    </div>
  )
}

/**
 * Very compact relative time — "2m ago", "3h ago", "1d ago". Not
 * localized; the admin surface is English-only. Falls back to the raw
 * timestamp if parsing fails.
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
