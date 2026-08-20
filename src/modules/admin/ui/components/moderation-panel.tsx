import { Ban, ShieldOff } from 'lucide-react'
import type { AdminUser } from '@modules/admin/api/admin-users-service'
import { useUserModeration } from '@modules/admin/model/use-user-moderation'
import { HoldToConfirm } from '@shared/ui/hold-to-confirm'
import { Button } from '@shared/ui/button'
import { cn } from '@shared/lib/cn'

/**
 * Ban / unban, as a visible panel rather than a row in an overflow menu.
 *
 * On the roster a "…" menu is right — the action is one of many on a dense
 * grid. On a page dedicated to a single account it is the reason an admin
 * came here, and hiding the page's most consequential control behind a menu
 * makes it something you have to already know about to find.
 *
 * Ban holds to confirm; unban is a plain click. Friction belongs on the
 * action that signs a person out of a banking tool, not on the one that lets
 * them back in.
 */
interface Props {
  user: AdminUser
  /** True when this is the signed-in admin — the BE refuses self-bans. */
  isSelf: boolean
  /** Called after a successful ban/unban so the page can refetch. */
  onChanged: () => void
}

export function ModerationPanel({ user, isSelf, onChanged }: Props) {
  const { busy, isBanned, banBlockedReason, ban, unban } = useUserModeration(
    user,
    isSelf,
    onChanged,
  )

  return (
    <section
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-divider bg-panel p-4',
        busy && 'pointer-events-none opacity-50',
      )}
    >
      <header>
        <h3 className="font-display text-sm uppercase tracking-widest text-heading">
          Moderation
        </h3>
        <p className="mt-0.5 text-xs text-muted">
          {isBanned
            ? 'This account is banned. It cannot sign in.'
            : 'This account can sign in normally.'}
        </p>
      </header>

      {isBanned ? (
        <>
          <p className="flex items-start gap-2 rounded-md border border-danger/40 bg-danger-soft px-2.5 py-2 text-xs text-danger">
            <ShieldOff className="mt-0.5 size-3.5 shrink-0" />
            <span>
              Login is blocked and every session was revoked when the ban was applied.
            </span>
          </p>
          <Button size="sm" variant="secondary" onClick={unban} className="self-start">
            Unban user
          </Button>
        </>
      ) : (
        <>
          <p className="text-xs text-muted">
            Banning ends every active session immediately and blocks login until the
            account is unbanned. Reversible from this page.
          </p>
          {banBlockedReason ? (
            <p className="flex items-center gap-2 rounded-md border border-divider bg-surface px-2.5 py-2 text-xs text-muted">
              <Ban className="size-3.5 shrink-0" />
              {banBlockedReason}.
            </p>
          ) : (
            <HoldToConfirm onConfirm={ban} className="self-start">
              Hold to ban
            </HoldToConfirm>
          )}
        </>
      )}
    </section>
  )
}
