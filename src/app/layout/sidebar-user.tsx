import { UserRound } from 'lucide-react'
import { useMe } from '@modules/auth/model/use-me'

/**
 * Sidebar footer row — shows the authenticated caller's email. Also acts as
 * a ghost-session tripwire: `useMe` fires `GET /auth/me` on mount, and on
 * 401 clears the auth store + redirects to /login. So a user whose account
 * was deleted server-side (but who still holds a valid-looking token in
 * localStorage) gets bounced within one page load.
 */
export function SidebarUser() {
  const { data, loading } = useMe()

  return (
    <div
      className="flex h-11 items-center gap-3 rounded-md px-3"
      title={data?.email}
    >
      <span className="flex shrink-0 text-muted">
        <UserRound className="size-5" />
      </span>
      <span className="flex-1 truncate text-sm font-medium text-body">
        {loading ? (
          <span className="inline-block h-4 w-24 animate-pulse rounded bg-surface" />
        ) : (
          data?.email ?? 'Unknown'
        )}
      </span>
    </div>
  )
}
