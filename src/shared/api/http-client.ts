import { env } from '@shared/config/env'
import { useAuthStore } from '@modules/auth/model/auth-store'

type QueryParams = Record<string, string | number | boolean | undefined>

interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: QueryParams
  body?: unknown
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { params, body, headers, ...rest } = options
  const url = new URL(`${env.apiBaseUrl}${path}`, window.location.origin)

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value))
    }
  }

  // Attach the access token (if any) on EVERY call — protected endpoints
  // require it and public endpoints ignore it, so unconditional attach is safe
  // and removes the "did I remember to add the header?" foot-gun for callers.
  const accessToken = useAuthStore.getState().accessToken
  const authHeader: HeadersInit = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}

  // FormData bodies (file upload, multipart) must NOT be JSON.stringify'd and
  // must NOT carry a Content-Type header — the browser sets multipart/form-data
  // with the correct boundary automatically. Otherwise, default to JSON.
  const isFormData = body instanceof FormData
  const contentTypeHeader: HeadersInit =
    body !== undefined && !isFormData ? { 'Content-Type': 'application/json' } : {}

  const response = await fetch(url, {
    ...rest,
    // credentials: 'include' so the HttpOnly refresh cookie set by the BE on
    // login travels back on /api/auth/refresh (silent refresh — later ticket).
    credentials: 'include',
    headers: { ...contentTypeHeader, ...authHeader, ...headers },
    body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`)
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
