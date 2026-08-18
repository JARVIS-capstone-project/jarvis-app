/**
 * MOCK per-user MCP connections.
 *
 * Shaped after agent-system's real `ConnectionResponse`
 * (`modules/connectors/schemas.py`) so wiring this up later is a swap of the
 * data source, not a rewrite of the panel: same `catalogId`, same `status`
 * vocabulary, same `enabled` flag.
 *
 * Nothing here is fetched. `GET /mcp/connections` is scoped to the *calling*
 * user's own principal, so an admin cannot read another account's connections
 * through it — reaching this data for real needs a new admin-scoped endpoint
 * on agent-system, not just a client change. The panel labels itself as mock
 * data on screen so nobody reads it as live state in the meantime.
 */

/** The two providers this project plans to support. */
export type McpCatalogId = 'jira' | 'slack'

/** Mirrors the platform's status vocabulary exactly. */
export type McpConnectionStatus = 'connected' | 'login_required' | 'error' | 'added'

export interface McpConnectionView {
  id: string
  catalogId: McpCatalogId
  name: string
  status: McpConnectionStatus
  /** A disabled connection stays configured but drops out of the agent's reach. */
  enabled: boolean
  createdAt: string
}

/**
 * Deterministic per-user fixture — keyed off the id so two different users do
 * not render an identical list. A one-row panel and a two-row panel size very
 * differently next to Moderation, and a fixture that never varies would hide
 * that from us until real data arrived.
 */
export function mockConnectionsFor(userId: string): McpConnectionView[] {
  const all: McpConnectionView[] = [
    {
      id: 'mock-jira',
      catalogId: 'jira',
      name: 'Jira',
      status: 'connected',
      enabled: true,
      createdAt: '2026-08-12T09:24:00Z',
    },
    {
      id: 'mock-slack',
      catalogId: 'slack',
      name: 'Slack',
      status: 'login_required',
      enabled: true,
      createdAt: '2026-08-14T11:02:00Z',
    },
  ]
  // Rough spread: most users get both, some get one, some get none.
  const bucket = userId.charCodeAt(0) % 4
  if (bucket === 0) return []
  if (bucket === 1) return all.slice(0, 1)
  return all
}
