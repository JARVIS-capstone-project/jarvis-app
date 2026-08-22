import { agentHttpClient } from '@shared/api/agent-http-client'

/**
 * Per-user MCP connections on agent-system (`modules/connectors/api.py`).
 *
 * Every route is scoped to the caller's own principal, so this is a "my
 * servers" API, not an admin one — an admin cannot read another account's
 * connections through it.
 *
 * Reached at `/agent/mcp/*`: the Vite dev proxy (and the same-origin gateway
 * in prod) strips `/agent` before forwarding to the Python service, which
 * mounts this router at `/mcp`.
 */

/** Status vocabulary the platform writes. `added` means "never handshaken". */
export type ConnectionStatus = 'added' | 'connected' | 'login_required' | 'error'
export type McpTransport = 'http' | 'sse'
export type McpAuthType = 'none' | 'header' | 'oauth'

export interface CatalogEntry {
  id: string
  name: string
  description: string
  transport: McpTransport
  auth_type: McpAuthType
  trusted: boolean
  requires_login: boolean
  /**
   * Currently `null` for every entry — no catalog row ships a default URL yet,
   * so the add form always asks for one. Once the platform fills these in the
   * field simply arrives prefilled.
   */
  server_url: string | null
}

export interface Connection {
  id: string
  name: string
  catalog_id: string | null
  server_url: string
  transport: McpTransport
  auth_type: McpAuthType
  trusted: boolean
  enabled: boolean
  status: ConnectionStatus
  has_credentials: boolean
  created_at: string
}

export interface AddConnectionBody {
  name: string
  catalog_id?: string | null
  server_url?: string | null
  transport?: McpTransport
  auth_type?: McpAuthType
  headers?: Record<string, string>
  trusted?: boolean | null
}

/**
 * The only three fields the platform accepts on update. `name` and
 * `server_url` are **not** among them despite what the endpoint's own summary
 * claims — `UpdateConnectionRequest` carries enabled/trusted/headers and
 * nothing else, so the UI treats identity fields as read-only.
 */
export interface UpdateConnectionBody {
  enabled?: boolean
  trusted?: boolean
  headers?: Record<string, string>
}

/** Always HTTP 200 — a broken server is config to show, not an error to raise. */
export interface ConnectionTestResult {
  ok: boolean
  tool_count?: number | null
  tools: string[]
  error?: string | null
}

/**
 * The three connectors this product ships.
 *
 * `/mcp/catalog` answers with eight: it also carries `custom`, `web-search`,
 * `trello`, `datadog` and `github`, which are the platform's suggestions
 * rather than ours. Rendering "whatever the API returned" would put
 * connectors outside the product's scope in front of users.
 *
 * Order follows this array rather than the response, so the browse grid
 * stays stable if the platform ever reorders or trims its own catalog.
 * Dropping `custom` costs nothing — the list view's "Custom" button opens
 * the same form with no catalog entry behind it.
 */
const BROWSABLE_CATALOG_IDS = ['jira', 'slack', 'notion'] as const

export const mcpConnectionsService = {
  async catalog() {
    const entries = await agentHttpClient.get<CatalogEntry[]>('/mcp/catalog')
    const byId = new Map(entries.map((e) => [e.id, e]))
    return BROWSABLE_CATALOG_IDS.map((id) => byId.get(id)).filter(
      (e): e is CatalogEntry => e !== undefined,
    )
  },
  list() {
    return agentHttpClient.get<Connection[]>('/mcp/connections')
  },
  add(body: AddConnectionBody) {
    return agentHttpClient.post<Connection>('/mcp/connections', body)
  },
  update(id: string, body: UpdateConnectionBody) {
    return agentHttpClient.patch<Connection>(`/mcp/connections/${id}`, body)
  },
  remove(id: string) {
    return agentHttpClient.delete<void>(`/mcp/connections/${id}`)
  },
  test(id: string) {
    return agentHttpClient.post<ConnectionTestResult>(`/mcp/connections/${id}/test`)
  },
}
