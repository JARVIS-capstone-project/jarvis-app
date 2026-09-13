import { env } from '@shared/config/env'
import { useAuthStore } from '@modules/auth/model/auth-store'
import { refreshAccessToken } from '@modules/auth/model/refresh-access-token'

type QueryParams = Record<string, string | number | boolean | undefined>

interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: QueryParams
  body?: unknown
}

/**
 * Build the fetch request with the CURRENT access token from auth-store.
 * Split out from `request()` so we can call it twice on the retry-on-401
 * path (once with the old token, once with the refreshed one).
 */
function buildRequest(
  path: string,
  options: RequestOptions,
): { url: URL; init: RequestInit } {
  const { params, body, headers, ...rest } = options
  const url = new URL(`${env.platformBaseUrl}${path}`, window.location.origin)

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
      // credentials: 'include' so the HttpOnly refresh cookie set by the BE
      // on login travels back on /api/auth/refresh (silent refresh).
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

/**
 * Structured error thrown for non-2xx responses. The `message` string is kept
 * in the legacy `Request failed: {status} {statusText}` shape so existing
 * `err.message.includes('401')` guards continue to work; new callers that
 * need a specific behavior (e.g. login → email_not_verified) should switch
 * on `err.code` instead.
 */
export class HttpApiError extends Error {
  readonly status: number
  /** BE's `error` field from the ApiError body, e.g. "email_not_verified". Null if the body wasn't JSON. */
  readonly code: string | null
  /** BE's `message` field from the ApiError body — human-readable detail. Null if the body wasn't JSON. */
  readonly detail: string | null

  constructor(status: number, statusText: string, code: string | null, detail: string | null) {
    super(`Request failed: ${status} ${statusText}`)
    this.name = 'HttpApiError'
    this.status = status
    this.code = code
    this.detail = detail
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let { url, init } = buildRequest(path, options)
  let response = await fetch(url, init)

  // Retry-on-401: try refresh, then replay ONCE. Skip for the refresh
  // endpoint itself to avoid infinite loops if refresh returns 401.
  if (response.status === 401 && !path.startsWith('/auth/refresh')) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      // Rebuild — buildRequest reads the just-updated token from auth-store.
      ;({ url, init } = buildRequest(path, options))
      response = await fetch(url, init)
    }
    // If newToken is null, refreshAccessToken already redirected to /login —
    // the throw below still fires and the caller sees the 401. Fine.
  }

  if (!response.ok) {
    // Peek at the body for a BE failure envelope. Best-effort: network hiccups /
    // non-JSON bodies just leave `code` + `detail` null and the legacy message
    // format takes over.
    //
    // Two envelopes are in play and they disagree on the shape of `error`:
    //   auth/jwt  → { error: "email_not_verified", message }      — flat string
    //   private-KB → { status, error: { code, message } }          — nested object
    // Reading only the flat shape made `code` an object and `detail` null for
    // every KB failure, so MALWARE_DETECTED and its siblings could never be
    // told apart from a generic 500 at the call site.
    let code: string | null = null
    let detail: string | null = null
    try {
      const body = (await response.clone().json()) as {
        error?: string | { code?: string; message?: string }
        message?: string
      }
      if (body.error && typeof body.error === 'object') {
        code = body.error.code ?? null
        detail = body.error.message ?? body.message ?? null
      } else {
        code = body.error ?? null
        detail = body.message ?? null
      }
    } catch {
      // ignore — not a JSON body
    }
    throw new HttpApiError(response.status, response.statusText, code, detail)
  }

  // 204 No Content has no body to parse.
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

/** Thin typed wrapper over fetch. All calls go through the /api proxy. */
export const httpClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
}
