import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { UploadedDocument } from '@modules/chat/model/types'

/**
 * Persisted list of every KB upload attempt made from this browser.
 * Mirrors the auth-store pattern (zustand + persist + localStorage).
 *
 * Scope: origin-wide (NOT per-user). If two accounts sign in on the same
 * browser, they'll see a merged list — accepted for MVP since this store
 * powers a dev-only page. Revisit when a real "My Documents" page ships:
 * key by userId, or clear the store on logout.
 *
 * Bytes for each doc live separately in IndexedDB (see document-blob-cache);
 * this store holds only metadata (~200 bytes per row).
 */
interface DocumentsState {
  docs: UploadedDocument[]
  add: (doc: UploadedDocument) => void
  update: (key: string, patch: Partial<UploadedDocument>) => void
  /** Rarely used from UI — reserved for blob-cache eviction / logout sweep. */
  remove: (key: string) => void
}

export const useDocumentsStore = create<DocumentsState>()(
  persist(
    (set) => ({
      docs: [],
      add: (doc) => set((s) => ({ docs: [...s.docs, doc] })),
      update: (key, patch) =>
        set((s) => ({
          docs: s.docs.map((d) => (d.key === key ? { ...d, ...patch } : d)),
        })),
      remove: (key) => set((s) => ({ docs: s.docs.filter((d) => d.key !== key) })),
    }),
    {
      name: 'jarvis.documents',
      storage: createJSONStorage(() => localStorage),
      // Persist only the data slice — action functions are recreated each mount.
      partialize: (s) => ({ docs: s.docs }),
    },
  ),
)

// Selector hooks — subscribe only to the slice the caller needs so
// components don't re-render on unrelated changes.
export const useDocuments = () => useDocumentsStore((s) => s.docs)
