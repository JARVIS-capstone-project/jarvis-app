import { useState } from 'react'
import { Info } from 'lucide-react'
import {
  mcpConnectionsService,
  type CatalogEntry,
  type Connection,
  type ConnectionTestResult,
  type McpAuthType,
  type McpTransport,
} from '@modules/connectors/api/mcp-connections-service'
import { BackHeader } from '@modules/connectors/ui/components/back-header'
import { Field, SegmentedChoice } from '@modules/connectors/ui/components/form-controls'
import { Button } from '@shared/ui/button'
import { Input } from '@shared/ui/input'
import { HttpApiError } from '@shared/api/http-client'
import { toast } from '@shared/model/toast-store'

/**
 * Add a server — reached blank ("Custom") or seeded from a catalog entry.
 *
 * **Server URL is always asked for, even from the catalog.** Not one of the
 * eight catalog rows ships a `server_url` today, so posting a bare
 * `catalog_id` comes back 400 from `service.add_connection`. Seeding the field
 * from `entry.server_url` (rather than hiding it) means the day the platform
 * fills those in, this form starts arriving prefilled and nothing here changes.
 *
 * `oauth` is offered but disabled for the same reason one step further on:
 * `build_authorize_url` needs an `oauth_config` no catalog entry carries yet.
 */
interface Props {
  entry?: CatalogEntry
  onCancel: () => void
  /**
   * Receives the new server *and* its first handshake. Testing here rather
   * than on the detail view's mount keeps the call tied to the click that
   * caused it, and turns "it saved" into "it works" — which is the question
   * the user actually has — before they ever see the detail pane.
   */
  onAdded: (conn: Connection, testResult: ConnectionTestResult | null) => void
}

export function AddConnectionView({ entry, onCancel, onAdded }: Props) {
  const [name, setName] = useState(entry?.name ?? '')
  const [serverUrl, setServerUrl] = useState(entry?.server_url ?? '')
  const [transport, setTransport] = useState<McpTransport>(entry?.transport ?? 'http')
  const [authType, setAuthType] = useState<McpAuthType>(
    entry?.auth_type === 'oauth' ? 'header' : (entry?.auth_type ?? 'none'),
  )
  const [headerKey, setHeaderKey] = useState('Authorization')
  const [headerValue, setHeaderValue] = useState('')
  const [saving, setSaving] = useState(false)

  const canSubmit = name.trim() !== '' && serverUrl.trim() !== '' && !saving

  const submit = async () => {
    if (!canSubmit) return
    setSaving(true)
    try {
      const conn = await mcpConnectionsService.add({
        name: name.trim(),
        catalog_id: entry?.id ?? null,
        server_url: serverUrl.trim(),
        transport,
        auth_type: authType,
        headers:
          authType === 'header' && headerKey.trim()
            ? { [headerKey.trim()]: headerValue }
            : {},
      })
      toast.success(`${conn.name} added`)
      // `/test` answers 200 even for an unreachable server, so a null here
      // means the request itself failed, not that the server is down.
      const testResult = await mcpConnectionsService
        .test(conn.id)
        .catch(() => null)
      onAdded(conn, testResult)
    } catch (err) {
      const detail = err instanceof HttpApiError ? err.detail : null
      toast.danger(detail ?? 'Could not add this server')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <BackHeader onBack={onCancel}>{entry ? `Add ${entry.name}` : 'Add custom MCP'}</BackHeader>

      {entry?.auth_type === 'oauth' && (
        <p className="flex items-start gap-2 rounded-md border border-divider bg-surface px-2.5 py-2 text-xs text-muted">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          <span>
            {entry.name} normally signs in with OAuth, which is not configured on this
            deployment yet. Add it with an API token header for now.
          </span>
        </p>
      )}

      <Field label="Name">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jira" />
      </Field>

      <Field
        label="Server URL"
        hint="The MCP endpoint, e.g. http://127.0.0.1:9100/mcp"
      >
        <Input
          value={serverUrl}
          onChange={(e) => setServerUrl(e.target.value)}
          placeholder="https://example.com/mcp"
        />
      </Field>

      <Field label="Transport">
        <SegmentedChoice
          options={[
            { value: 'http', label: 'HTTP' },
            { value: 'sse', label: 'SSE' },
          ]}
          value={transport}
          onChange={(v) => setTransport(v as McpTransport)}
        />
      </Field>

      <Field label="Authentication">
        <SegmentedChoice
          options={[
            { value: 'none', label: 'None' },
            { value: 'header', label: 'Header' },
            { value: 'oauth', label: 'OAuth', disabled: true },
          ]}
          value={authType}
          onChange={(v) => setAuthType(v as McpAuthType)}
          disabledHint="OAuth is not configured on this deployment yet"
        />
      </Field>

      {authType === 'header' && (
        <div className="flex gap-2">
          <Field label="Header" className="flex-1">
            <Input value={headerKey} onChange={(e) => setHeaderKey(e.target.value)} />
          </Field>
          <Field label="Value" className="flex-[2]">
            <Input
              type="password"
              value={headerValue}
              onChange={(e) => setHeaderValue(e.target.value)}
              placeholder="Bearer …"
            />
          </Field>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={submit} disabled={!canSubmit} isLoading={saving}>
          Add server
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
