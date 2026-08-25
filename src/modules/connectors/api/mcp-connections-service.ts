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

/**
 * Where to send the user to approve a connection. The platform holds the OAuth app
 * credentials per provider, so the browser never sees or sends one — it only opens
 * this URL and waits for the connection's status to flip.
 */
export interface OAuthAuthorizeResult {
  authorize_url: string
}

/** Always HTTP 200 — a broken server is config to show, not an error to raise. */
export interface ConnectionTestResult {
  ok: boolean
  tool_count?: number | null
  tools: string[]
  error?: string | null
}

export const mcpConnectionsService = {
  catalog() {
    return agentHttpClient.get<CatalogEntry[]>('/mcp/catalog')
  },
  list() {
    return agentHttpClient.get<Connection[]>('/mcp/connections')
  },
  /** One connection. Used to poll for `status` flipping after an OAuth redirect. */
  get(id: string) {
    return agentHttpClient.get<Connection>(`/mcp/connections/${id}`)
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
  /**
   * Mint a fresh consent URL for a connection awaiting login.
   *
   * The `state` inside expires after ten minutes, so this is called again rather than
   * reused whenever the user retries — the URL is single-use in practice.
   */
  oauthAuthorize(id: string) {
    return agentHttpClient.post<OAuthAuthorizeResult>(
      `/mcp/connections/${id}/oauth/authorize`,
    )
  },
}
