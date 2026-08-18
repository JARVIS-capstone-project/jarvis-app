import { Link, useParams } from 'react-router'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { adminUsersService } from '@modules/admin/api/admin-users-service'
import { useEndpoint } from '@modules/admin/model/use-endpoint'
import { JobRolePicker } from '@modules/admin/ui/components/job-role-picker'
import { UserDetailHeader } from '@modules/admin/ui/components/user-detail-header'
import { ModerationPanel } from '@modules/admin/ui/components/moderation-panel'
import { ConnectedAppsPanel } from '@modules/admin/ui/components/connected-apps-panel'
import { SkeletonBar, SkeletonBlock } from '@modules/admin/ui/components/skeleton-shapes'
import { useCurrentUserId } from '@modules/auth/model/auth-store'
import { cn } from '@shared/lib/cn'

/**
 * `/admin/users/:id` — one account: an identity banner carrying every field
 * the platform returns, then the two things an admin can actually do to it.
 *
 * The layout is deliberate. `AdminUserView` has five fields, three of which
 * are the banner's own headline and badges, so a separate facts panel would
 * have been half duplication and would have sat half-empty beside the
 * controls. Instead both columns below hold *actions* — they carry similar
 * weight, so they balance without either being padded to match the other.
 *
 * That projection is also the whole surface: no session list, no login
 * history, no profile. Rather than invent panels the API cannot fill, the
 * page shows what exists and `JobRolePicker` states its own read gap inline.
 */
export function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const currentUserId = useCurrentUserId()

  const { data, error, loading, refetch } = useEndpoint(
    () => (id ? adminUsersService.get(id) : Promise.resolve(null)),
    [id],
  )

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/admin/users"
          className="flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-heading"
        >
          <ArrowLeft className="size-3.5" />
          All users
        </Link>
        <button
          type="button"
          onClick={refetch}
          disabled={loading}
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-divider bg-surface px-2.5 py-1 text-xs text-body transition-colors hover:bg-hover hover:text-heading disabled:cursor-wait disabled:opacity-50"
        >
          <RefreshCw className={cn('size-3', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {error && (
        <p className="rounded-md border border-danger/40 bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {loading && data === null ? (
        <DetailSkeleton />
      ) : data ? (
        <>
          <UserDetailHeader user={data} />
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
            <JobRolePicker userId={data.id} />
            <div className="flex flex-col gap-4">
              <ModerationPanel
                user={data}
                isSelf={data.id === currentUserId}
                onChanged={refetch}
              />
              <ConnectedAppsPanel userId={data.id} />
            </div>
          </div>
        </>
      ) : (
        !error && (
          <p className="rounded-xl border border-dashed border-divider bg-panel px-4 py-12 text-center text-sm text-muted">
            No user with that id.
          </p>
        )
      )}
    </section>
  )
}

function DetailSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-4">
      <div className="flex items-center gap-3 rounded-xl border border-divider bg-panel p-4">
        <SkeletonBlock className="size-12 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonBar className="h-4 w-48" />
          <SkeletonBar className="h-4 w-32 rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SkeletonBlock className="h-56" />
        <SkeletonBlock className="h-56" />
      </div>
    </div>
  )
}
