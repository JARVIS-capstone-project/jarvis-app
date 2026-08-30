import { useState } from 'react'
import type { AdminUser } from '@modules/admin/api/admin-users-service'
import { UserCardMenu } from '@modules/admin/ui/components/user-card-menu'
import {
  Monogram,
  UserBadges,
} from '@modules/admin/ui/components/user-identity'
import { formatJoined } from '@modules/admin/model/format-date'
import { cn } from '@shared/lib/cn'

/**
 * One user in the admin roster: identity on top, roles and account status
 * along the bottom, moderation actions behind the "…" menu.
 *
 * Presentation only — every mutation lives in `UserCardMenu`. The card keeps
 * just enough state to dim itself while that menu has a request in flight.
 */
interface Props {
  user: AdminUser
  /** True when this row is the signed-in admin — the BE refuses self-bans. */
  isSelf: boolean
  /** Called after a successful ban/unban so the list can refetch. */
  onChanged: () => void
  className?: string
}

export function UserCard({ user, isSelf, onChanged, className }: Props) {
  const [busy, setBusy] = useState(false)
  const isBanned = user.status === 'disabled'

  return (
    <article
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-divider bg-panel p-4 transition-colors hover:bg-hover',
        // A banned row should read as inert at a glance, before any label is read.
        isBanned && 'opacity-60',
        busy && 'pointer-events-none opacity-50',
        className,
      )}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <Monogram email={user.email} muted={isBanned} />
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-heading" title={user.email}>
              {user.email}
            </div>
            <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted">
              {user.id.slice(0, 8)} · {formatJoined(user.createdAt)}
            </div>
          </div>
        </div>

        <UserCardMenu
          user={user}
          isSelf={isSelf}
          onChanged={onChanged}
          onBusyChange={setBusy}
        />
      </header>

      <div className="mt-auto flex flex-wrap items-end gap-1">
        <UserBadges roles={user.roles} status={user.status} />
      </div>
    </article>
  )
}
