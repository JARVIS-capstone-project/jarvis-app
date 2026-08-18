import { useEffect, useState } from 'react'
import { Ban, Copy, ExternalLink, UserCheck } from 'lucide-react'
import type { AdminUser } from '@modules/admin/api/admin-users-service'
import { useUserModeration } from '@modules/admin/model/use-user-moderation'
import {
  CardMenu,
  CardMenuItem,
  CardMenuLink,
  CardMenuSeparator,
} from '@modules/admin/ui/components/card-menu'
import { HoldToConfirm } from '@shared/ui/hold-to-confirm'
import { toast } from '@shared/model/toast-store'

/**
 * The "…" menu on a roster card. A menu is right *here* — moderation is one
 * action among several on a dense grid — but not on the detail page, where
 * `ModerationPanel` puts the same call in the open. Both share
 * `useUserModeration`, so what is permitted cannot drift between them.
 */
interface Props {
  user: AdminUser
  /** True when this row is the signed-in admin — the BE refuses self-bans. */
  isSelf: boolean
  /** Called after a successful ban/unban so the list can refetch. */
  onChanged: () => void
  /** Lets the card dim itself while a request is in flight. */
  onBusyChange: (busy: boolean) => void
}

export function UserCardMenu({ user, isSelf, onChanged, onBusyChange }: Props) {
  const { busy, isBanned, banBlockedReason, ban, unban } = useUserModeration(
    user,
    isSelf,
    onChanged,
  )

  // The hook owns the flag; the card owns the dimming. Mirrored through an
  // effect rather than called from the handlers so the two cannot disagree
  // when a request settles.
  useEffect(() => onBusyChange(busy), [busy, onBusyChange])

  return (
    <CardMenu label={`Actions for ${user.email}`} className="shrink-0">
      {(close) => (
        <>
          <CardMenuLink
            to={`/admin/users/${user.id}`}
            icon={<ExternalLink className="size-3.5" />}
            onSelect={close}
          >
            View details
          </CardMenuLink>
          <CardMenuItem
            icon={<Copy className="size-3.5" />}
            onSelect={() => {
              void navigator.clipboard.writeText(user.id)
              toast.success('User ID copied')
              close()
            }}
          >
            Copy user ID
          </CardMenuItem>

          <CardMenuSeparator />

          {isBanned ? (
            <CardMenuItem
              icon={<UserCheck className="size-3.5" />}
              onSelect={() => {
                close()
                unban()
              }}
            >
              Unban user
            </CardMenuItem>
          ) : (
            <BanConfirm
              disabled={Boolean(banBlockedReason)}
              reason={banBlockedReason ?? undefined}
              onConfirm={() => {
                close()
                ban()
              }}
            />
          )}
        </>
      )}
    </CardMenu>
  )
}

/**
 * The ban row and its confirm step, swapped in place. Kept inside the menu
 * rather than raised into a modal: a dialog needs its own focus trap and
 * overlay for a two-word decision the menu can hold on its own.
 */
function BanConfirm({
  disabled,
  reason,
  onConfirm,
}: {
  disabled: boolean
  reason?: string
  onConfirm: () => void
}) {
  const [armed, setArmed] = useState(false)

  if (!armed) {
    return (
      <CardMenuItem
        danger
        icon={<Ban className="size-3.5" />}
        disabled={disabled}
        title={reason}
        onSelect={() => setArmed(true)}
      >
        Ban user
      </CardMenuItem>
    )
  }

  return (
    <div className="px-2.5 py-2">
      <p className="mb-2 text-xs text-muted">
        Signs them out everywhere and blocks login until unbanned.
      </p>
      <HoldToConfirm onConfirm={onConfirm} className="w-full">
        Hold to ban
      </HoldToConfirm>
    </div>
  )
}
