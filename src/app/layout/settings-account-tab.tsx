import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { useMe } from '@modules/auth/model/use-me'
import { useWorkspaceProfile } from '@modules/workspace/model/use-workspace-profile'
import { cn } from '@shared/lib/cn'

const JOINED_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  year: 'numeric',
})

/**
 * Content of the Account tab inside the settings modal. Read-only for now —
 * no PUT endpoints exist yet (job-role update lands with the workspace edit
 * ticket). Composes two independent fetches so a single failure never blanks
 * the whole surface:
 *   - `useMe`      → email + roles + createdAt + user id
 *   - `useWorkspaceProfile` → jobRole (hidden entirely on 404 / empty string)
 *
 * Each row skeleton-fades independently while its source is loading.
 */
export function SettingsAccountTab() {
  const me = useMe()
  const workspace = useWorkspaceProfile()

  const email = me.data?.email ?? ''
  const roles = me.data?.roles ?? []
  const jobRole = workspace.data?.jobRole?.trim() ?? ''
  const joinedLabel = me.data?.createdAt
    ? `Joined ${JOINED_FORMATTER.format(new Date(me.data.createdAt))}`
    : ''

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h3 className="mb-4 text-lg font-semibold text-heading">Profile</h3>
        <div className="flex items-center gap-4">
          <Avatar email={email} loading={me.loading} />
          <div className="min-w-0 flex-1">
            {me.loading ? (
              <div className="flex flex-col gap-2">
                <div className="h-5 w-56 animate-pulse rounded bg-surface" />
                <div className="h-4 w-32 animate-pulse rounded bg-surface" />
              </div>
            ) : (
              <>
                <p className="truncate text-base font-medium text-heading">
                  {email || 'Unknown user'}
                </p>
                {jobRole && (
                  <p className="truncate text-sm text-body">{jobRole}</p>
                )}
                {joinedLabel && (
                  <p className="text-xs text-muted">{joinedLabel}</p>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-4 text-lg font-semibold text-heading">Details</h3>
        <div className="flex flex-col divide-y divide-divider">
          <DetailRow label="Roles">
            {me.loading ? (
              <span className="h-4 w-14 animate-pulse rounded bg-surface" />
            ) : roles.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {roles.map((role) => (
                  <span
                    key={role}
                    className="rounded-full border border-divider bg-surface px-2 py-0.5 text-xs font-medium uppercase tracking-wider text-body"
                  >
                    {role}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-sm text-muted">—</span>
            )}
          </DetailRow>

          <DetailRow label="User ID">
            {me.loading ? (
              <span className="h-4 w-40 animate-pulse rounded bg-surface" />
            ) : me.data?.id ? (
              <CopyableId id={me.data.id} />
            ) : (
              <span className="text-sm text-muted">—</span>
            )}
          </DetailRow>
        </div>

        {workspace.error && (
          <p className="mt-3 text-xs text-danger" role="alert">
            Could not load workspace profile: {workspace.error}
          </p>
        )}
      </section>
    </div>
  )
}

function Avatar({ email, loading }: { email: string; loading: boolean }) {
  if (loading) {
    return <div className="size-14 shrink-0 animate-pulse rounded-full bg-surface" />
  }
  const local = email.split('@')[0] ?? ''
  const initials = (local.slice(0, 2) || '?').toUpperCase()
  return (
    <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand/15 text-lg font-semibold uppercase text-brand">
      {initials}
    </div>
  )
}

function DetailRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-sm text-body">{label}</span>
      <div className="flex min-w-0 items-center justify-end">{children}</div>
    </div>
  )
}

function CopyableId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false)

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(id)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard is best-effort; silently no-op if the browser blocks us.
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      title="Copy user ID"
      className={cn(
        'flex items-center gap-2 rounded-md border border-divider bg-surface px-2 py-1 font-mono text-xs text-muted transition-colors',
        'hover:bg-hover hover:text-heading',
      )}
    >
      <span className="max-w-[16ch] truncate">{id}</span>
      {copied ? (
        <Check className="size-3 text-brand" />
      ) : (
        <Copy className="size-3" />
      )}
    </button>
  )
}
