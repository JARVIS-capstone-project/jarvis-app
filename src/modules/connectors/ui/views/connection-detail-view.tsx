import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import {
  mcpConnectionsService,
  type Connection,
  type ConnectionTestResult,
} from '@modules/connectors/api/mcp-connections-service'
import { BackHeader } from '@modules/connectors/ui/components/back-header'
import { Field } from '@modules/connectors/ui/components/form-controls'
import { ConnectionStatusBadge } from '@modules/connectors/ui/components/connection-status-badge'
import { TestResultPanel } from '@modules/connectors/ui/components/test-result-panel'
import { McpLogo } from '@shared/ui/mcp-logo'
import { Badge } from '@shared/ui/badge'
import { Button } from '@shared/ui/button'
import { Input } from '@shared/ui/input'
import { Switch } from '@shared/ui/switch'
import { HoldToConfirm } from '@shared/ui/hold-to-confirm'
import { HttpApiError } from '@shared/api/http-client'
import { toast } from '@shared/model/toast-store'

/**
 * One server: what it is, whether it answers, and the two things that can be
 * changed about it.
 *
 * Name and URL are **read-only**, and that is the platform's shape rather
 * than a simplification here: `UpdateConnectionRequest` carries only
 * `enabled`, `trusted` and `headers`, so an editable name would be a field
 * that silently discards what you typed.
 *
 * `trusted` is deliberately not offered either. It is a security control, not
 * a preference — `policy.py` refuses every non-read tool on an untrusted
 * server, so a switch here would let a user quietly disarm that on a server
 * the deployment classified as untrusted. It renders as a badge instead.
 */
interface Props {
  conn: Connection
  /**
   * Handshake result from the add flow, if this view was reached by creating
   * the server. Seeding it here rather than firing a test on mount keeps the
   * request tied to the action that wanted it — an effect would re-run on
   * every remount and answer a question nobody asked.
   */
  initialResult?: ConnectionTestResult | null
  onBack: () => void
  onChanged: () => void
  onDeleted: () => void
}

export function ConnectionDetailView({
  conn,
  initialResult,
  onBack,
  onChanged,
  onDeleted,
}: Props) {
  const [headerKey, setHeaderKey] = useState('Authorization')
  const [headerValue, setHeaderValue] = useState('')
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<ConnectionTestResult | null>(initialResult ?? null)
  const [busy, setBusy] = useState(false)

  const runTest = async () => {
    setTesting(true)
    try {
      setResult(await mcpConnectionsService.test(conn.id))
    } catch (err) {
      const detail = err instanceof HttpApiError ? err.detail : null
      setResult({ ok: false, tools: [], error: detail ?? 'Request failed' })
    } finally {
      setTesting(false)
    }
  }

  const patch = async (body: Parameters<typeof mcpConnectionsService.update>[1]) => {
    setBusy(true)
    try {
      await mcpConnectionsService.update(conn.id, body)
      onChanged()
    } catch (err) {
      const detail = err instanceof HttpApiError ? err.detail : null
      toast.danger(detail ?? 'Could not update this server')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await mcpConnectionsService.remove(conn.id)
      toast.success(`${conn.name} removed`)
      onDeleted()
    } catch (err) {
      const detail = err instanceof HttpApiError ? err.detail : null
      toast.danger(detail ?? 'Could not remove this server')
      setBusy(false)
    }
  }

  return (
    <div className={busy ? 'pointer-events-none opacity-50' : undefined}>
      <div className="flex flex-col gap-4">
        <BackHeader onBack={onBack}>{conn.name}</BackHeader>

        <div className="flex items-center gap-2.5 rounded-lg border border-divider bg-surface px-3 py-2.5">
          <McpLogo catalogId={conn.catalog_id} />
          <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-body">
            {conn.server_url}
          </code>
          <Badge variant={conn.trusted ? 'neutral' : 'warning'}>
            {conn.trusted ? 'trusted' : 'untrusted'}
          </Badge>
          <ConnectionStatusBadge status={conn.status} enabled={conn.enabled} />
        </div>

        {!conn.trusted && (
          <p className="text-[11px] text-muted">
            Untrusted servers are read-only to the agent and their results are cited as
            information only.
          </p>
        )}

        {conn.auth_type === 'header' && (
          <div className="flex gap-2">
            <Field label="Header" className="flex-1">
              <Input value={headerKey} onChange={(e) => setHeaderKey(e.target.value)} />
            </Field>
            <Field label="New value" className="flex-[2]" hint="Leave blank to keep the current one.">
              <Input
                type="password"
                value={headerValue}
                onChange={(e) => setHeaderValue(e.target.value)}
                placeholder="••••••••"
              />
            </Field>
          </div>
        )}
        {conn.auth_type === 'header' && (
          <Button
            size="sm"
            variant="secondary"
            disabled={!headerValue.trim()}
            onClick={() => {
              void patch({ headers: { [headerKey.trim()]: headerValue } })
              setHeaderValue('')
            }}
            className="self-start"
          >
            Replace credential
          </Button>
        )}

        <div className="flex flex-col gap-2">
          <Button size="sm" variant="secondary" onClick={runTest} isLoading={testing} className="self-start">
            Test connection
          </Button>
          {result && <TestResultPanel result={result} />}
        </div>

        <label className="flex items-center justify-between gap-3 rounded-lg border border-divider px-3 py-2.5">
          <span className="min-w-0">
            <span className="block text-sm text-heading">Enabled</span>
            <span className="block text-xs text-muted">
              Disabled servers stay configured but drop out of the agent's reach.
            </span>
          </span>
          <Switch
            checked={conn.enabled}
            onCheckedChange={(enabled) => void patch({ enabled })}
            aria-label="Enabled"
          />
        </label>

        <div className="flex flex-col gap-2 rounded-lg border border-danger/30 px-3 py-2.5">
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <Trash2 className="size-3.5" />
            Removing deletes the stored credential. This cannot be undone.
          </span>
          <HoldToConfirm onConfirm={remove} className="self-start">
            Hold to remove
          </HoldToConfirm>
        </div>
      </div>
    </div>
  )
}
