import { httpClient } from '@shared/api/http-client'

/**
 * Response shape from POST /api/kb/documents (201 on success).
 * Field names mirror the BE (snake_case) so callers see the raw contract.
 */
export interface UploadDocumentResponse {
  status: 'done'
  source_id: string
  job_id: string
  filename: string
  content_type: string
  size_bytes: number
  /** ISO-8601 timestamp. */
  created_at: string
  /** ISO-8601 — created_at + ~24h (the BE hint; GCS lifecycle is authoritative). */
  file_expires_at: string
}

/**
 * Response from GET /api/kb/documents/{sourceId}/content (200).
 * `file_url` is a short-lived V4 signed GCS URL — NEVER persist client-side
 * (see the BE DTO's own contract on this).
 */
export interface DocumentContentResponse {
  source_id: string
  file_url: string
  url_expires_at: string
  filename: string
  content_type: string
  size_bytes: number
  file_expires_at: string
}

/**
 * Response from GET /api/kb/upload-jobs/{jobId} (200). Present for every
 * upload attempt — success OR failure. `source_id` is null on failed rows;
 * `error` is a string on failed and null on done.
 */
export interface UploadJobResponse {
  job_id: string
  status: 'DONE' | 'FAILED'
  filename: string
  source_id: string | null
  started_at: string
  finished_at: string
  error: string | null
  file_count: number
}

/**
 * Typed client for the Private KB endpoints. httpClient already handles
 * bearer auth (via auth-store) and multipart bodies (FormData is detected
 * and the browser sets the boundary automatically).
 */
export const kbService = {
  /**
   * Upload one file. Server assigns `source_id` + `job_id`; response returns
   * both. `metadata` is optional JSON-string metadata (empty by default —
   * we don't send anything yet).
   */
  uploadDocument: (file: File, metadata = '') => {
    const form = new FormData()
    form.append('file', file)
    if (metadata) form.append('metadata', metadata)
    return httpClient.post<UploadDocumentResponse>('/kb/documents', form)
  },

  /** Mint a fresh 15-min V4 signed URL for a stored document. Idempotent. */
  getDocumentContent: (sourceId: string) =>
    httpClient.get<DocumentContentResponse>(`/kb/documents/${sourceId}/content`),

  /** Fetch the recorded upload attempt (audit trail). */
  getUploadJob: (jobId: string) =>
    httpClient.get<UploadJobResponse>(`/kb/upload-jobs/${jobId}`),
}
