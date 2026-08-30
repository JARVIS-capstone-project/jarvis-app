import { del, get, set } from 'idb-keyval'

/**
 * IndexedDB-backed cache for uploaded file bytes, keyed by `sourceId`.
 * Lets `/dev/document` rebuild a `blob:` URL after F5 without hitting
 * the backend — see phase-03 preview resolver for the read path.
 *
 * IndexedDB natively holds Blob/File objects (no base64), so a 5 MB PDF
 * costs 5 MB of local storage. Bytes are NEVER auto-purged — we keep
 * them past the 24h GCS lifecycle by design (local user can still see
 * their own file). Only manual browser storage-clear evicts them.
 */

// Namespaced key so this coexists cleanly with any future idb-keyval users.
const key = (sourceId: string) => `doc-blob:${sourceId}`

export const documentBlobCache = {
  /** Write the file's bytes. Call once after a successful upload. */
  put: (sourceId: string, blob: Blob) => set(key(sourceId), blob),

  /** Read the cached bytes. Returns undefined on cache miss. */
  read: (sourceId: string) => get<Blob | undefined>(key(sourceId)),

  /** Evict a single entry — used by future logout / manual delete flows. */
  drop: (sourceId: string) => del(key(sourceId)),
}
