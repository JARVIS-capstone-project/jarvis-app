import { useCallback, useEffect, useState } from 'react'
import { NavLink, useNavigate, useParams } from 'react-router'
import { ArrowDownWideNarrow, Trash2 } from 'lucide-react'
import { agentService } from '@modules/chat/api/agent-service'
import { documentBlobCache } from '@modules/chat/model/document-blob-cache'
import { useChatSessionStore } from '@modules/chat/model/chat-session-store'
import {
  useSessions,
  useSessionsLoading,
  useSessionsStore,
} from '@modules/chat/model/sessions-store'
import { DeleteSessionDialog } from '@modules/chat/ui/components/delete-session-dialog'
import { toast } from '@shared/model/toast-store'
import { cn } from '@shared/lib/cn'
import type { SessionSummary } from '@modules/chat/api/agent-types'

/** What the row shows. A session minted this turn has no preview yet — BE
 *  only fills it once a turn commits — and `title` is derived from the same
 *  user message, so the row reads correctly until the preview arrives. */
const rowLabel = (s: SessionSummary) => s.last_message_preview ?? s.title

/**
 * "Recent" chat list rendered inside the sidebar. Hydrates from
 * `GET /agent/sessions` on mount and reads from `sessions-store` on every
 * render — so newly-created sessions (added optimistically by
 * `useChatSend`) appear immediately.
 *
 * Titles single-line truncate with a full-text `title` tooltip. Sort icon
 * is a visual-only placeholder — real sort ships alongside search later.
 */
export function SessionHistory() {
  const sessions = useSessions()
  const loading = useSessionsLoading()
  const setAll = useSessionsStore((s) => s.setAll)
  const setLoading = useSessionsStore((s) => s.setLoading)
  const removeSession = useSessionsStore((s) => s.removeSession)
  const navigate = useNavigate()
  const { sessionId: openSessionId } = useParams()

  // Which row's dialog is open. Holding the whole summary (not just the id)
  // keeps the prompt's label stable even as the list re-sorts underneath.
  const [pending, setPending] = useState<SessionSummary | null>(null)

  // Fetch-once-on-mount. Failures leave the list empty; a global 401
  // handler will land in a later ticket.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const list = await agentService.listSessions()
        if (!cancelled) setAll(list)
      } catch {
        // Swallow — banner-less UX. Sidebar just stays empty on failure.
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [setAll, setLoading])

  /**
   * Runs after the hold completes. The dialog closes first and the outcome
   * lands in a toast, because the request outlives the surface that started
   * it: deleting the open session navigates away, and a spinner inside a
   * dialog on a route that no longer exists has nowhere to resolve.
   *
   * Local state is cleared only once the BE has confirmed. Dropping the row
   * optimistically would mean rebuilding it from a stale copy on failure,
   * and the sidebar would sit wrong until the next mount if that missed.
   */
  const confirmDelete = useCallback(
    async (session: SessionSummary) => {
      const id = session.session_id
      setPending(null)
      try {
        const { source_ids } = await agentService.deleteSession(id)

        removeSession(id)
        useChatSessionStore.getState().dropSession(id)

        // The response is what tells us which cached blobs belonged to this
        // session — the cache is keyed by source_id alone. Failures here are
        // swallowed: the server copy is already gone, and a stranded local
        // blob is not worth failing a completed delete over.
        await Promise.allSettled(
          (source_ids ?? []).map((sourceId) => documentBlobCache.drop(sourceId)),
        )

        // Only the open session forces a move; deleting any other row leaves
        // the user where they were. `/new` because the session the URL named no
        // longer exists, and there is no bare `/chat` route — navigating there
        // matched nothing and rendered a blank page. Same destination
        // `use-hydrate-session` uses on a 404, so a session that vanishes behaves
        // identically whether the user deleted it or followed a stale link.
        if (openSessionId === id) navigate('/new', { replace: true })

        toast.success('Conversation deleted')
      } catch {
        toast.danger('Could not delete the conversation. Please try again.')
      }
    },
    [navigate, openSessionId, removeSession],
  )

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <div className="flex items-center justify-between px-3">
        <span className="text-xs font-medium uppercase tracking-wider text-muted">
          Recent
        </span>
        <button
          type="button"
          aria-label="Sort recent sessions (coming soon)"
          title="Sort — coming soon"
          className="text-body transition-colors hover:text-heading"
        >
          <ArrowDownWideNarrow className="size-4" />
        </button>
      </div>
      <ul className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {loading && sessions.length === 0 && (
          <li className="px-3 py-2 text-sm text-muted">Loading…</li>
        )}
        {!loading && sessions.length === 0 && (
          <li className="px-3 py-2 text-sm text-muted">No sessions yet</li>
        )}
        {sessions.map((s) => (
          <SessionRow
            key={s.session_id}
            session={s}
            onRequestDelete={() => setPending(s)}
          />
        ))}
      </ul>

      <DeleteSessionDialog
        open={pending !== null}
        sessionLabel={pending ? rowLabel(pending) : ''}
        onCancel={() => setPending(null)}
        onConfirm={() => pending && confirmDelete(pending)}
      />
    </div>
  )
}

/**
 * One row. The delete button is a sibling of the link rather than a child —
 * a button inside an anchor is invalid markup and leaves keyboard users
 * unable to reach the inner control.
 *
 * It reveals on hover and on keyboard focus. `focus-within` carries the
 * second case: tabbing to the button is what makes it visible, so gating on
 * hover alone would leave it permanently invisible to keyboard navigation.
 */
function SessionRow({
  session,
  onRequestDelete,
}: {
  session: SessionSummary
  onRequestDelete: () => void
}) {
  const label = rowLabel(session)

  return (
    <li className="group relative">
      <NavLink
        to={`/chat/${session.session_id}`}
        title={label}
        className={({ isActive }) =>
          cn(
            // Right padding clears the delete button so long titles truncate
            // before they reach it instead of running underneath.
            'block w-full truncate rounded-md py-2 pl-3 pr-10 text-left text-sm transition-colors',
            isActive ? 'bg-hover text-heading' : 'text-heading hover:bg-hover',
          )
        }
      >
        {label}
      </NavLink>

      <button
        type="button"
        onClick={onRequestDelete}
        aria-label={`Delete conversation: ${label}`}
        title="Delete conversation"
        className={cn(
          'absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md',
          'text-muted opacity-0 transition-opacity hover:bg-danger-soft hover:text-danger',
          'focus-visible:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100',
        )}
      >
        <Trash2 className="size-4" />
      </button>
    </li>
  )
}
