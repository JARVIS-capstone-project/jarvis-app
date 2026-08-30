import { Copy } from 'lucide-react'
import type { AdminUser } from '@modules/admin/api/admin-users-service'
import { Monogram, UserBadges } from '@modules/admin/ui/components/user-identity'
import { formatJoined } from '@modules/admin/model/format-date'
import { toast } from '@shared/model/toast-store'
import { cn } from '@shared/lib/cn'

/**
 * Identity banner for one account — and the only place its raw fields appear.
 *
 * There is no separate "Account" panel: `AdminUserView` carries five fields,
 * three of which (email, roles, status) are already the banner's own headline
 * and badges. A panel repeating them read as substance while being duplication,
 * and left a half-empty column beside the controls. The two that are genuinely
 * extra — id and join date — fit on one line here.
 */
export function UserDetailHeader({ user }: { user: AdminUser }) {
  const isBanned = user.status === 'disabled'

  return (
    <header className="flex items-start gap-3 rounded-xl border border-divider bg-panel p-4">
      <Monogram email={user.email} muted={isBanned} size="lg" />
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-base font-medium text-heading" title={user.email}>
          {user.email}
        </h2>
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          <UserBadges roles={user.roles} status={user.status} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-widest text-muted">
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(user.id)
              toast.success('User ID copied')
            }}
            title="Copy full ID"
            className={cn(
              'group flex items-center gap-1.5 transition-colors hover:text-heading',
              // Lowercase: a UUID is a literal value, not a label, and the
              // tracking that suits the labels around it makes hex unreadable.
              'normal-case tracking-normal',
            )}
          >
            <span className="truncate">{user.id}</span>
            <Copy className="size-3 shrink-0 transition-colors group-hover:text-heading" />
          </button>
          <span aria-hidden="true">·</span>
          <span>joined {formatJoined(user.createdAt)}</span>
        </div>
      </div>
    </header>
  )
}
