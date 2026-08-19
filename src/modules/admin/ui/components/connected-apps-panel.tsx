import { FlaskConical, Plug } from 'lucide-react'
import {
  mockConnectionsFor,
  type McpConnectionStatus,
  type McpConnectionView,
} from '@modules/admin/api/mcp-connections-mock'
import { McpLogo } from '@shared/ui/mcp-logo'
import { formatJoined } from '@modules/admin/model/format-date'
import { Badge, type BadgeVariant } from '@shared/ui/badge'
import { cn } from '@shared/lib/cn'

/**
 * The MCP servers a user has connected — Jira and Slack for now.
 *
 * **Mock data, and the panel says so on screen.** An admin surface that
 * displays invented connection state without flagging it is worse than one
 * that shows nothing: someone would read "Slack · login required" as a real
 * finding and go chase it. The notice is not placeholder chrome to delete
 * later — it comes out the same commit the real fetch goes in.
 */
const STATUS_META: Record<
  McpConnectionStatus,
  { label: string; variant: BadgeVariant }
> = {
  connected: { label: 'connected', variant: 'success' },
  login_required: { label: 'login required', variant: 'warning' },
  error: { label: 'error', variant: 'danger' },
  added: { label: 'not connected', variant: 'neutral' },
}

export function ConnectedAppsPanel({ userId }: { userId: string }) {
  const connections = mockConnectionsFor(userId)

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-divider bg-panel p-4">
      <header>
        <h3 className="font-display text-sm uppercase tracking-widest text-heading">
          Connected apps
        </h3>
        <p className="mt-0.5 text-xs text-muted">
          External tools the agent may call on this user&apos;s behalf.
        </p>
      </header>

      <p className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning-soft px-2.5 py-2 text-xs text-warning">
        <FlaskConical className="mt-0.5 size-3.5 shrink-0" />
        <span>
          Mock data. Per-user MCP config is not wired to this page yet — reading it
          needs an admin-scoped endpoint on agent-system.
        </span>
      </p>

      {connections.length === 0 ? (
        <p className="flex items-center gap-2 rounded-md border border-dashed border-divider px-2.5 py-3 text-xs text-muted">
          <Plug className="size-3.5 shrink-0" />
          No apps connected.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {connections.map((conn) => (
            <ConnectionRow key={conn.id} conn={conn} />
          ))}
        </ul>
      )}
    </section>
  )
}

function ConnectionRow({ conn }: { conn: McpConnectionView }) {
  const meta = STATUS_META[conn.status]
  const isLive = conn.status === 'connected' && conn.enabled

  return (
    <li
      className={cn(
        'flex items-center gap-2.5 rounded-md px-2 py-2',
        // Anything the agent cannot actually reach right now reads back — a
        // disabled Jira and a connected one must not look alike at a glance.
        !isLive && 'opacity-70',
      )}
    >
      <McpLogo catalogId={conn.catalogId} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm text-heading">{conn.name}</div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted">
          added {formatJoined(conn.createdAt)}
        </div>
      </div>
      {!conn.enabled && <Badge variant="neutral">disabled</Badge>}
      <Badge variant={meta.variant}>{meta.label}</Badge>
    </li>
  )
}
