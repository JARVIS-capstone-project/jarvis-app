import type { ConnectionStatus } from '@modules/connectors/api/mcp-connections-service'
import { Badge, type BadgeVariant } from '@shared/ui/badge'

/**
 * The platform's connection status, in the words a user can act on.
 *
 * `login_required` is the one that matters: it is also what a *working*
 * connection decays into when its OAuth tokens expire, so the label has to
 * read as "do this now", not as a state name. "login_required" printed raw
 * leaves someone wondering whether Jira broke.
 */
const META: Record<ConnectionStatus, { label: string; variant: BadgeVariant }> = {
  connected: { label: 'connected', variant: 'success' },
  login_required: { label: 'sign in needed', variant: 'warning' },
  error: { label: 'error', variant: 'danger' },
  added: { label: 'not tested', variant: 'neutral' },
}

export function ConnectionStatusBadge({
  status,
  enabled,
}: {
  status: ConnectionStatus
  /** A disabled server is out of the agent's reach whatever its status says. */
  enabled?: boolean
}) {
  if (enabled === false) return <Badge variant="neutral">disabled</Badge>
  const meta = META[status] ?? { label: status, variant: 'neutral' as const }
  return <Badge variant={meta.variant}>{meta.label}</Badge>
}
