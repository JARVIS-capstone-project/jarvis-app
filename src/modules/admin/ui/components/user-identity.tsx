import { ShieldCheck } from 'lucide-react'
import { Badge, type BadgeVariant } from '@shared/ui/badge'
import { cn } from '@shared/lib/cn'

/**
 * The presentational atoms a user is drawn from, shared by the roster card
 * and the detail header so the same account never renders two different ways
 * on two screens.
 */

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  active: 'success',
  pending: 'warning',
  disabled: 'danger',
}

/** First letter of the local part, in a brand-tinted disc. */
export function Monogram({
  email,
  muted = false,
  size = 'sm',
}: {
  email: string
  /** Drains the brand tint — used when the account is banned. */
  muted?: boolean
  size?: 'sm' | 'lg'
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-semibold uppercase',
        size === 'lg' ? 'size-12 text-lg' : 'size-8 text-xs',
        muted ? 'bg-surface text-muted' : 'bg-brand-glow-soft text-brand',
      )}
    >
      {email.charAt(0)}
    </span>
  )
}

/**
 * Role chips followed by the account status. ADMIN is lifted out and given
 * the brand token — on this surface it is the one role that changes what the
 * person can do to everyone else.
 */
export function UserBadges({ roles, status }: { roles: string[]; status: string }) {
  return (
    <>
      {roles.includes('ADMIN') && (
        <Badge variant="brand" leftIcon={<ShieldCheck className="size-3" />}>
          admin
        </Badge>
      )}
      {roles
        .filter((r) => r !== 'ADMIN')
        .map((r) => (
          <Badge key={r} variant="neutral">
            {r.toLowerCase()}
          </Badge>
        ))}
      <Badge variant={STATUS_VARIANT[status] ?? 'neutral'}>{status}</Badge>
    </>
  )
}
