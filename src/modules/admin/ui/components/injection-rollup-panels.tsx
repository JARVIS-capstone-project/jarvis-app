import { Link } from 'react-router'
import type { InjectionSummary } from '@modules/admin/api/admin-audit-service'
import { relTime } from '@modules/admin/model/format-date'
import { Badge } from '@shared/ui/badge'
import { cn } from '@shared/lib/cn'

/**
 * The two rollup lists beside the day chart: WHO was flagged and WHAT matched.
 *
 * The two rows behave differently on purpose. A user is a destination — the ban
 * lives on their account page, so the row navigates. A pattern is a lens — it
 * narrows the feed below without losing the page, so the row filters in place.
 *
 * WHO counts every flagged turn regardless of origin, which mixes the account
 * that typed a payload with the one that merely opened a poisoned ticket. The
 * feed below re-splits them; this list cannot, so its hint stays descriptive
 * ("most flagged turns") rather than accusatory.
 */
interface Props {
  summary: InjectionSummary
  activePattern: string | null
  onPatternSelect: (pattern: string | null) => void
}

export function InjectionRollupPanels({ summary, activePattern, onPatternSelect }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Panel title="Who" hint="Most flagged turns first. Repetition is the signal.">
        <ul className="flex flex-col gap-1">
          {summary.top_users.map((u) => (
            <li key={u.user_id}>
              <Link
                to={`/admin/users/${u.user_id}`}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-hover"
              >
                <code className="min-w-0 flex-1 truncate font-mono text-xs text-body">
                  {u.user_id.slice(0, 8)}
                </code>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
                  {relTime(u.last_seen)}
                </span>
                <Badge variant={u.turns >= 10 ? 'danger' : 'warning'}>{u.turns}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="What" hint="Scanner label, counted once per turn. Click to filter the feed.">
        <ul className="flex flex-col gap-1">
          {summary.by_pattern.map((p) => {
            const isActive = p.pattern === activePattern
            return (
              <li key={p.pattern}>
                <button
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => onPatternSelect(isActive ? null : p.pattern)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors',
                    isActive ? 'bg-hover' : 'hover:bg-hover',
                  )}
                >
                  <code
                    className={cn(
                      'min-w-0 flex-1 truncate font-mono text-xs',
                      isActive ? 'text-heading' : 'text-body',
                    )}
                  >
                    {p.pattern}
                  </code>
                  <Badge variant={isActive ? 'brand' : 'neutral'}>{p.turns}</Badge>
                </button>
              </li>
            )
          })}
        </ul>
      </Panel>
    </div>
  )
}

function Panel({
  title,
  hint,
  children,
}: {
  title: string
  hint: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-divider bg-panel p-4">
      <h3 className="font-display text-sm uppercase tracking-widest text-heading">{title}</h3>
      <p className="mb-2 mt-0.5 text-xs text-muted">{hint}</p>
      {children}
    </section>
  )
}
