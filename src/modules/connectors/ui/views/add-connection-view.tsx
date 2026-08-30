import { useState } from 'react'
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
 * Add a server by hand — "Custom MCP", or a catalog entry the platform holds no
 * provider config for (header-auth rows like Datadog).
 *
 * OAuth providers do not come here: they carry no URL to type and no credential to
 * paste, so Browse sends them straight to `OAuthConnectView`. The field is still
 * seeded from `entry.server_url`, which the platform now fills for any catalog row
 * it has a provider entry for.
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
  const [authType, setAuthType] = useState<McpAuthType>(entry?.auth_type ?? 'none')
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
          disabledHint="Sign-in is available on the Browse screen for supported providers"
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
