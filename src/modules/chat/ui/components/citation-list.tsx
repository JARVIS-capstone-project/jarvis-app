import { useId } from 'react'
import { FileText, Paperclip, ShieldCheck, ShieldAlert } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import type { CitationRef } from '@modules/chat/api/agent-types'

interface Props {
  refs: CitationRef[]
}

/**
 * The documents an answer rests on, listed under it — one row per source, with
 * a badge saying how far that source is trusted.
 *
 * This is the durable half of the trust surface. The validation status line
 * above the answer is transient by design (it clears the moment text starts),
 * so if the question "what was this built on, and was any of it unvetted?" is
 * to survive a scroll or a reload, it has to live here.
 *
 * Nothing is interactive. A KB document has no user-facing URL at all
 * (`url: null`), and while an attachment does, the file is already reachable
 * from the tile on the user's own message — a second, differently-styled way
 * in would just be two affordances for one thing.
 */
export function CitationList({ refs }: Props) {
  // Per-instance: several messages in one transcript each render a list, and a
  // hard-coded id would collide across them.
  const labelId = useId()
  if (refs.length === 0) return null

  return (
    <div className="mt-3 flex flex-col gap-1.5 border-t border-divider pt-3">
      <span
        id={labelId}
        className="text-xs font-medium uppercase tracking-wider text-muted"
      >
        Sources
      </span>
      <ul aria-labelledby={labelId} className="flex flex-col gap-1">
        {refs.map((ref) => (
          <CitationRow key={ref.source_id} citation={ref} />
        ))}
      </ul>
    </div>
  )
}

function CitationRow({ citation }: { citation: CitationRef }) {
  const verified = citation.file_status === 'verified'
  // `kind` picks the icon (what sort of thing this is); `file_status` picks the
  // badge (how far to trust it). They are deliberately not derived from each
  // other — the BE contract reserves the right to add a source type that sets
  // the second without changing the meaning of the first.
  const KindIcon = citation.kind === 'attachment' ? Paperclip : FileText
  const StatusIcon = verified ? ShieldCheck : ShieldAlert

  return (
    <li className="flex min-w-0 items-center gap-2 text-xs">
      <KindIcon className="size-3.5 shrink-0 text-muted" />
      <span className="min-w-0 flex-1 truncate text-body" title={citation.label}>
        {citation.label}
      </span>
      <span
        className={cn(
          'inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 font-medium',
          verified
            ? 'border-success/40 bg-success-soft text-success'
            : 'border-warning/40 bg-warning-soft text-warning',
        )}
      >
        <StatusIcon className="size-3" />
        {verified ? 'Verified' : 'Untrusted'}
      </span>
    </li>
  )
}
