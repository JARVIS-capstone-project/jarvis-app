import { useState } from 'react'
import {
  adminUsersService,
  type AdminUser,
} from '@modules/admin/api/admin-users-service'
import { HttpApiError } from '@shared/api/http-client'
import { toast } from '@shared/model/toast-store'

/**
 * Ban / unban for one user, shared by the roster card's "…" menu and the
 * detail page's moderation panel so the two surfaces cannot drift on what is
 * allowed or on how a refusal is reported.
 *
 * The BE refuses a ban in three cases, only two of which a client can know:
 * a pending user and the acting admin's own account. Those come back as
 * `banBlockedReason` so a caller can disable its control and say why up
 * front. "Last active admin" is knowable only server-side — it is allowed
 * through and its 409 surfaces as a toast.
 */
export interface UserModeration {
  /** True while a request is in flight — callers dim themselves. */
  busy: boolean
  /** Non-null when a ban would certainly be refused; the text explains why. */
  banBlockedReason: string | null
  isBanned: boolean
  ban: () => void
  unban: () => void
}

export function useUserModeration(
  user: AdminUser,
  isSelf: boolean,
  onChanged: () => void,
): UserModeration {
  const [busy, setBusy] = useState(false)

  const run = async (action: 'ban' | 'unban') => {
    setBusy(true)
    try {
      await adminUsersService[action](user.id)
      toast.success(`${user.email} ${action === 'ban' ? 'banned' : 'unbanned'}`)
      onChanged()
    } catch (err) {
      // A 409 carries the real reason (last active admin, already banned, …).
      // Prefer it over the generic status line: it is the only text that tells
      // the admin what to do differently.
      const detail = err instanceof HttpApiError ? err.detail : null
      toast.danger(detail ?? `Could not ${action} ${user.email}`)
    } finally {
      setBusy(false)
    }
  }

  return {
    busy,
    isBanned: user.status === 'disabled',
    banBlockedReason: isSelf
      ? 'You cannot ban your own account'
      : user.status === 'pending'
        ? 'User is still pending verification'
        : null,
    ban: () => void run('ban'),
    unban: () => void run('unban'),
  }
}
