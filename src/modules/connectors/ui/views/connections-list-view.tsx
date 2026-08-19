import { ChevronRight, Plug, Plus, Search } from 'lucide-react'
import type { Connection } from '@modules/connectors/api/mcp-connections-service'
import { ConnectionStatusBadge } from '@modules/connectors/ui/components/connection-status-badge'
import { McpLogo } from '@shared/ui/mcp-logo'
import { Switch } from '@shared/ui/switch'
import { SkeletonBar } from '@modules/admin/ui/components/skeleton-shapes'
import { cn } from '@shared/lib/cn'

/**
 * Root view of the Connections tab: every MCP server this user has added.
 *
 * The row's toggle and its navigation are two different intents sharing one
 * strip of pixels, so the switch stops propagation — flipping a server off
 * must not also open it.
 */
interface Props {
  connections: Connection[]
  loading: boolean
  error: string | null
  onOpen: (id: string) => void
  onToggle: (conn: Connection, enabled: boolean) => void
  onBrowse: () => void
  onAddCustom: () => void
}

export function ConnectionsListView({
  connections,
  loading,
  error,
  onOpen,
  onToggle,
  onBrowse,
  onAddCustom,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-sm uppercase tracking-widest text-heading">
            Connections
          </h3>
          <p className="mt-0.5 text-xs text-muted">
            External tools the agent may call on your behalf.
          </p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <ActionButton icon={<Search className="size-3" />} onClick={onBrowse}>
            Browse
          </ActionButton>
          <ActionButton icon={<Plus className="size-3" />} onClick={onAddCustom}>
            Custom
          </ActionButton>
        </div>
      </header>

      {error && (
        <p className="rounded-md border border-danger/40 bg-danger-soft px-2.5 py-2 text-xs text-danger">
          {error}
        </p>
      )}

      {loading && connections.length === 0 ? (
        <ListSkeleton />
      ) : connections.length === 0 && !error ? (
        <EmptyState onBrowse={onBrowse} />
      ) : (
        <ul className={cn('flex flex-col gap-1', loading && 'opacity-60')}>
          {connections.map((conn) => (
            <ConnectionRow
              key={conn.id}
              conn={conn}
              onOpen={() => onOpen(conn.id)}
              onToggle={(enabled) => onToggle(conn, enabled)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function ConnectionRow({
  conn,
  onOpen,
  onToggle,
}: {
  conn: Connection
  onOpen: () => void
  onToggle: (enabled: boolean) => void
}) {
  return (
    <li
      className={cn(
        'flex items-center gap-3 rounded-lg border border-divider bg-panel px-3 py-2.5 transition-colors hover:bg-hover',
        !conn.enabled && 'opacity-60',
      )}
    >
      {/* Navigation and the toggle are siblings, never nested: `Switch`
          renders a <button>, and a button inside a button is invalid HTML —
          browsers reparent it and the inner control loses its handler. Only
          the identity half navigates; the chevron is a decorative affordance
          pointing at it. */}
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <McpLogo catalogId={conn.catalog_id} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm text-heading">{conn.name}</span>
          <span className="block truncate font-mono text-[10px] text-muted">
            {conn.server_url}
          </span>
        </span>
      </button>
      <ConnectionStatusBadge status={conn.status} enabled={conn.enabled} />
      <Switch
        checked={conn.enabled}
        onCheckedChange={onToggle}
        aria-label={`${conn.enabled ? 'Disable' : 'Enable'} ${conn.name}`}
      />
      <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted" />
    </li>
  )
}

function EmptyState({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-divider px-4 py-10 text-center">
      <Plug className="size-5 text-muted" />
      <p className="text-sm text-body">No servers connected</p>
      <p className="max-w-xs text-xs text-muted">
        Connect Jira, Slack or your own MCP server and the agent can use its tools
        during a turn.
      </p>
      <ActionButton icon={<Search className="size-3" />} onClick={onBrowse}>
        Browse MCPs
      </ActionButton>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border border-divider bg-panel px-3 py-2.5"
        >
          <SkeletonBar className="size-5 shrink-0 rounded" />
          <div className="flex-1 space-y-1.5">
            <SkeletonBar className="h-3 w-24" />
            <SkeletonBar className="h-2 w-40" />
          </div>
          <SkeletonBar className="h-4 w-16 rounded-full" />
        </div>
      ))}
    </div>
  )
}

function ActionButton({
  icon,
  onClick,
  children,
}: {
  icon: React.ReactNode
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-md border border-divider bg-surface px-2.5 py-1 text-xs text-body transition-colors hover:bg-hover hover:text-heading"
    >
      {icon}
      {children}
    </button>
  )
}
