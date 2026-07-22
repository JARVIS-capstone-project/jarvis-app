import { useEffect } from 'react'
import { NavLink } from 'react-router'
import { ArrowDownWideNarrow } from 'lucide-react'
import { agentService } from '@modules/chat/api/agent-service'
import {
  useSessions,
  useSessionsLoading,
  useSessionsStore,
} from '@modules/chat/model/sessions-store'
import { cn } from '@shared/lib/cn'

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
          <li key={s.session_id}>
            <NavLink
              to={`/chat/${s.session_id}`}
              title={s.title}
              className={({ isActive }) =>
                cn(
                  'block w-full truncate rounded-md px-3 py-2 text-left text-sm transition-colors',
                  isActive
                    ? 'bg-hover text-heading'
                    : 'text-heading hover:bg-hover',
                )
              }
            >
              {s.title}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  )
}
