import { useState } from 'react'
import { Link } from 'react-router'
import { FileWarning, ShieldAlert } from 'lucide-react'
import type { AuditRow } from '@modules/admin/api/admin-audit-service'
import {
  contentOrigins,
  rowPatterns,
  typedByUser,
} from '@modules/admin/model/injection-origin'
import { relTime } from '@modules/admin/model/format-date'
import {
  patternLabel,
  patternTooltip,
} from '@modules/admin/model/injection-patterns'
import { Badge } from '@shared/ui/badge'
import { cn } from '@shared/lib/cn'

/**
 * One flagged turn. Renders in two shapes, because the API carries two.
 *
 * The account TYPED it → `flagged_input` holds the payload verbatim. That field
 * is the audit trail's single exception to previews-only, and it exists for
 * exactly this: ban evidence has to read as whole sentences, and a 200-char
 * preview cuts a long payload precisely where it matters.
 *
 * It READ something poisoned → there is no verbatim payload at all. The only
 * text available is the user's own question, which is *innocent*. It is
 * labelled "User asked" for that reason: unlabelled, it reads as the attack.
 *
 * `showUser` is off on a page that is already scoped to one account, where
 * repeating the id in every card is noise.
 */
const CLAMP_AT = 140

interface Props {
  row: AuditRow
  showUser?: boolean
}

export function InjectionCard({ row, showUser = true }: Props) {
  const [expanded, setExpanded] = useState(false)
  const byUser = typedByUser(row)
  const patterns = rowPatterns(row)
  const origins = contentOrigins(row)

  // `flagged_input` is null on read-poisoned turns; falling back to the preview
  // keeps the card from rendering an empty evidence block.
  const evidence = (byUser && row.flagged_input) || row.user_message_preview || ''
  const isLong = evidence.length > CLAMP_AT

  return (
    <article
      className={cn(
        // `h-full` + column layout so grid siblings share a row height without
        // the footer floating mid-card on the shorter ones.
        'flex h-full flex-col rounded-lg border bg-surface p-3',
        byUser ? 'border-warning/40' : 'border-divider',
      )}
    >
      <header className="flex flex-wrap items-center gap-2">
        {byUser ? (
          <ShieldAlert className="size-3.5 shrink-0 text-warning" />
        ) : (
          <FileWarning className="size-3.5 shrink-0 text-muted" />
        )}
        {showUser && (
          <Link
            to={`/admin/users/${row.user_id}`}
            className="font-mono text-xs text-body transition-colors hover:text-heading hover:underline"
          >
            {row.user_id.slice(0, 8)}
          </Link>
        )}
        <div className="ml-auto flex flex-wrap items-center gap-1">
          {patterns.map((p) => (
            <Badge key={p} variant={byUser ? 'warning' : 'neutral'} title={patternTooltip(p)}>
              {patternLabel(p)}
            </Badge>
          ))}
        </div>
      </header>

      {!byUser && origins.length > 0 && (
        <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-widest text-muted">
          via {origins.join(' · ')}
        </p>
      )}

      <p
        className={cn(
          'mt-2 whitespace-pre-wrap break-words text-sm text-body',
          !expanded && isLong && 'line-clamp-2',
        )}
      >
        {!byUser && <span className="text-muted">User asked: </span>}
        {evidence}
      </p>

      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-1 font-mono text-[10px] uppercase tracking-widest text-brand hover:underline"
        >
          {expanded ? 'Less' : 'More'}
        </button>
      )}

      <footer className="mt-auto flex flex-wrap items-center gap-1.5 pt-2 font-mono text-[10px] uppercase tracking-widest text-muted">
        <span>{relTime(row.created_at)}</span>
        {row.severity && (
          <>
            <span aria-hidden>·</span>
            <span>{row.severity}</span>
          </>
        )}
        <span aria-hidden>·</span>
        <span className="truncate">session {row.session_id.slice(0, 8)}</span>
      </footer>
    </article>
  )
}
