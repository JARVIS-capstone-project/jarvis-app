import { useAuthStore } from '@modules/auth/model/auth-store'
import { refreshAccessToken } from '@modules/auth/model/refresh-access-token'

/**
 * HTTP client for agent-system (port 8000 locally, gateway-routed in prod).
 * Sits alongside `http-client.ts` (platform-system) rather than extending
 * it — each client owns one base URL, one auth attach, one error shape.
 *
 * Vite dev-proxy maps `/agent/*` → :8000. In prod the same-origin gateway
 * routes `/agent/*` server-side. Either way, the FE always calls `/agent/…`.
 *
 * Every call carries the platform-issued Bearer JWT. Agent-system validates
 * it (RS256 against Platform's public key + gRPC revocation check). On 401
 * we call `POST /api/auth/refresh` once and replay the request with the
 * new access token — same silent-refresh path as `http-client`.
 */

const BASE = '/agent'

type QueryParams = Record<string, string | number | boolean | undefined>

interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: QueryParams
  body?: unknown
}

function buildRequest(
  path: string,
  options: RequestOptions,
): { url: URL; init: RequestInit } {
  const { params, body, headers, ...rest } = options
  const url = new URL(`${BASE}${path}`, window.location.origin)

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value))
    }
  }

  const accessToken = useAuthStore.getState().accessToken
  const authHeader: HeadersInit = accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : {}

  const isFormData = body instanceof FormData
  const contentTypeHeader: HeadersInit =
    body !== undefined && !isFormData ? { 'Content-Type': 'application/json' } : {}

  return {
    url,
    init: {
      ...rest,
      // agent-system doesn't set cookies, but keep parity with `http-client`
      // so any shared cookie (e.g. refresh cookie) travels the same way.
      credentials: 'include',
      headers: { ...contentTypeHeader, ...authHeader, ...headers },
      body: isFormData
        ? (body as FormData)
        : body !== undefined
          ? JSON.stringify(body)
          : undefined,
    },
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let { url, init } = buildRequest(path, options)
  let response = await fetch(url, init)

  // Retry-on-401 (once). Agent-system NEVER hosts /auth/refresh, so no
  // loop-guard needed here — refreshAccessToken hits platform via /api.
  if (response.status === 401) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      ;({ url, init } = buildRequest(path, options))
      response = await fetch(url, init)
    }
  }

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

function buildStreamRequest(path: string, body: unknown, signal: AbortSignal): {
  url: URL
  init: RequestInit
} {
  const accessToken = useAuthStore.getState().accessToken
  const authHeader: HeadersInit = accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : {}
  return {
    url: new URL(`${BASE}${path}`, window.location.origin),
    init: {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...authHeader,
      },
      body: JSON.stringify(body),
      signal,
    },
  }
}

/**
 * SSE variant. Returns the raw `Response` so the caller can drive the body
 * reader itself (see `use-sse-stream.ts`). The `AbortSignal` is required —
 * callers must always be able to cancel a live stream (RETRY protocol +
 * devtools-abort defense).
 *
 * Retry-on-401 works here too: if the initial POST 401s, we refresh and
 * replay. Once the stream is established, mid-stream re-auth is impossible
 * — that would be a much bigger refactor (queue frames, reopen, replay).
 */
async function requestStream(
  path: string,
  body: unknown,
  signal: AbortSignal,
): Promise<Response> {
  let { url, init } = buildStreamRequest(path, body, signal)
  let response = await fetch(url, init)

  if (response.status === 401) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      ;({ url, init } = buildStreamRequest(path, body, signal))
      response = await fetch(url, init)
    }
  }

  if (!response.ok) {
    throw new Error(`Stream open failed: ${response.status} ${response.statusText}`)
  }
  if (!response.body) {
    throw new Error('Stream open succeeded but body is null')
  }
  return response
}

export const agentHttpClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
  /**
   * Opens an SSE POST stream. Callers consume `response.body!.getReader()`
   * and drive the parser themselves. `signal.abort()` cleanly cancels the
   * fetch mid-stream.
   */
  postStream: requestStream,
}
