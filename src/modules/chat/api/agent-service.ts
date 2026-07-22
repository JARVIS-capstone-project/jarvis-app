import { agentHttpClient } from '@shared/api/agent-http-client'
import type {
  ChatRequest,
  ChatResponse,
  CreateSessionRequest,
  SessionDetail,
  SessionSummary,
  UpdateSessionRequest,
} from '@modules/chat/api/agent-types'

/**
 * Typed client for agent-system's `/sessions` surface. Every method targets
 * `/agent/sessions*` — the Vite dev-proxy strips `/agent` before forwarding,
 * so the BE mount at `/sessions` receives clean paths.
 *
 * Auth: every call carries the platform's Bearer JWT via `agentHttpClient`.
 * agent-system validates it (RS256 signature + revocation check).
 */
export const agentService = {
  /**
   * Creates a new session. Server assigns `session_id`. Body fields are
   * optional; we typically send `{ title, severity: null }` so the BE
   * auto-classifies severity from the first message.
   */
  createSession: (body: CreateSessionRequest) =>
    agentHttpClient.post<SessionDetail>('/sessions', body),

  /** Paginated list of the caller's sessions. Populates the sidebar. */
  listSessions: (limit = 50, offset = 0) =>
    agentHttpClient.get<SessionSummary[]>('/sessions', {
      params: { limit, offset },
    }),

  /** Full detail incl. messages. Used when re-entering a session by URL. */
  getSession: (sessionId: string) =>
    agentHttpClient.get<SessionDetail>(`/sessions/${sessionId}`),

  /** Rename or reclassify severity. Not used in the new-chat flow yet. */
  updateSession: (sessionId: string, body: UpdateSessionRequest) =>
    agentHttpClient.patch<SessionSummary>(`/sessions/${sessionId}`, body),

  /** Delete a session. Not wired in the new-chat flow — reserved. */
  deleteSession: (sessionId: string) =>
    agentHttpClient.delete<void>(`/sessions/${sessionId}`),

  /**
   * Non-streaming send. NOT used by this integration (we use openStream)
   * but declared so a future ticket can swap easily. Holds the connection
   * until the full ChatResponse lands (up to 150 s / 180 s per severity).
   */
  sendMessage: (sessionId: string, body: ChatRequest) =>
    agentHttpClient.post<ChatResponse>(`/sessions/${sessionId}/messages`, body),

  /**
   * Opens the SSE stream. Returns the raw `Response` so the caller reads
   * `response.body!.getReader()` and drives the SseParser. `AbortSignal`
   * cancels the fetch mid-stream (RETRY protocol + devtools abort).
   */
  openStream: (sessionId: string, body: ChatRequest, signal: AbortSignal) =>
    agentHttpClient.postStream(`/sessions/${sessionId}/stream`, body, signal),
}
