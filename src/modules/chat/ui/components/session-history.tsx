import { ArrowDownWideNarrow } from 'lucide-react'

/**
 * A single previously-opened chat thread. Real data lands with the
 * sessions/threads API — this shape and the mock list below stand in
 * for now.
 */
export interface ChatSession {
  id: string
  title: string
}

const MOCK_SESSIONS: ChatSession[] = [
  { id: 's1', title: 'User not receive the OTP after registration' },
  { id: 's2', title: 'Payment incident on IOS build' },
  { id: 's3', title: 'Payment incident on IOS - retry' },
  { id: 's4', title: 'Knowledge base processing failure' },
]

interface SessionHistoryProps {
  /** Override the list; defaults to a design mock until the API is wired. */
  sessions?: ChatSession[]
  /** Callback when a session row is clicked. Ignored while there's no real
   *  session route. */
  onSelect?: (id: string) => void
}

/**
 * "Recent" chat list rendered inside the sidebar. Titles single-line
 * truncate with a full-text `title` tooltip. Sort icon is a visual-only
 * placeholder — the actual sort control ships with the sessions API.
 */
export function SessionHistory({ sessions = MOCK_SESSIONS, onSelect }: SessionHistoryProps) {
  return (
    <div className="flex min-h-0 flex-col gap-2">
      <div className="flex items-center justify-between px-3">
        <span className="text-xs font-medium uppercase tracking-wider text-muted">Recent</span>
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
        {sessions.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onSelect?.(s.id)}
              title={s.title}
              className="block w-full truncate rounded-md px-3 py-2 text-left text-sm text-heading transition-colors hover:bg-hover"
            >
              {s.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
