import { useEffect, useRef, useState } from 'react'
import { Plug, Settings2 } from 'lucide-react'
import {
  mcpConnectionsService,
  type Connection,
} from '@modules/connectors/api/mcp-connections-service'
import { ConnectionStatusBadge } from '@modules/connectors/ui/components/connection-status-badge'
import { useEndpoint } from '@shared/model/use-endpoint'
import { settings } from '@shared/model/settings-store'
import { McpLogo } from '@shared/ui/mcp-logo'
import { Switch } from '@shared/ui/switch'
import { HttpApiError } from '@shared/api/http-client'
import { toast } from '@shared/model/toast-store'
import { cn } from '@shared/lib/cn'

/**
 * Composer control for the servers the agent may reach this turn.
 *
 * Deliberately not a second copy of the settings tab: from here you can see
 * what is live and switch it off, and nothing else. Adding, re-keying and
 * removing a server are configuration, they belong on the settings surface,
 * and "Manage connections" hands off to it rather than reproducing it in a
 * 288px popover.
 *
 * The badge count is the point of the button. Which servers are enabled
 * changes what the agent can do with the message you are about to send, so
 * it is status worth seeing without opening anything — which is also why this
 * is its own button rather than a row inside the attach menu.
 */
export function McpQuickMenu({ disabled }: { disabled?: boolean }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Only fetched while the menu is open: the composer is mounted for the whole
  // session and this list is not worth a request per chat load.
  const { data, loading, error, refetch } = useEndpoint(
    () => (open ? mcpConnectionsService.list() : Promise.resolve<Connection[]>([])),
    [open],
  )
  const connections = data ?? []
  const liveCount = connections.filter(
    (c) => c.enabled && c.status === 'connected',
  ).length

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const toggle = async (conn: Connection, enabled: boolean) => {
    try {
      await mcpConnectionsService.update(conn.id, { enabled })
      refetch()
    } catch (err) {
      const detail = err instanceof HttpApiError ? err.detail : null
      toast.danger(detail ?? `Could not update ${conn.name}`)
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Connected tools"
        title="Connected tools"
        className={cn(
          'relative flex size-9 items-center justify-center rounded-lg border border-divider bg-surface text-body transition-colors',
          disabled
            ? 'cursor-not-allowed opacity-50'
            : 'hover:bg-hover hover:text-heading',
          open && 'bg-hover text-heading',
        )}
      >
        <Plug className="size-4" />
        {liveCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-medium leading-4 text-white">
            {liveCount}
          </span>
        )}
      </button>

      {open && (
        // Opens upward: the composer sits at the bottom of the viewport.
        <div
          role="menu"
          aria-label="Connected tools"
          className="absolute bottom-full left-0 z-30 mb-2 w-72 overflow-hidden rounded-xl border border-divider bg-panel p-1 shadow-lg"
        >
          <div className="px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
            Tools available this turn
          </div>

          {error ? (
            <p className="px-2.5 py-2 text-xs text-danger">{error}</p>
          ) : loading && connections.length === 0 ? (
            <p className="px-2.5 py-3 text-xs text-muted">Loading…</p>
          ) : connections.length === 0 ? (
            <p className="px-2.5 py-3 text-xs text-muted">
              No servers connected yet.
            </p>
          ) : (
            <ul className="max-h-64 overflow-y-auto">
              {connections.map((conn) => (
                <li
                  key={conn.id}
                  className="flex items-center gap-2.5 rounded-md px-2.5 py-2 hover:bg-hover"
                >
                  <McpLogo catalogId={conn.catalog_id} className="size-4" />
                  <span className="min-w-0 flex-1 truncate text-sm text-body">
                    {conn.name}
                  </span>
                  <ConnectionStatusBadge status={conn.status} enabled={conn.enabled} />
                  <Switch
                    checked={conn.enabled}
                    onCheckedChange={(enabled) => void toggle(conn, enabled)}
                    aria-label={`${conn.enabled ? 'Disable' : 'Enable'} ${conn.name}`}
                  />
                </li>
              ))}
            </ul>
          )}

          <div className="my-1 h-px bg-divider" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              settings.open('connections')
            }}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm text-body transition-colors hover:bg-hover hover:text-heading"
          >
            <Settings2 className="size-3.5" />
            Manage connections…
          </button>
        </div>
      )}
    </div>
  )
}
