import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { LogOut, Upload, User2, X } from 'lucide-react'
import { useAuthStore, useUser } from '@modules/auth/model/auth-store'
import { env } from '@shared/config/env'
import { httpClient } from '@shared/api/http-client'
import { Button } from '@shared/ui/button'

/** A file the user picked, held entirely in the browser as a Blob. */
interface AttachedFile {
  key: string
  file: File
  /** blob:http://... URL — same-tab, same-session; dies on reload. */
  previewUrl: string
}

interface MeResult {
  status: number
  body: unknown
  error?: string
}

/**
 * Placeholder /new page. Chat UI lands in a follow-up ticket. Right now this
 * exposes three test actions used to dogfood the BE contract:
 *   - POST /auth/logout   → clear store, navigate to /login
 *   - GET  /auth/me       → dump status + body inline
 *   - Attach files        → hold locally as blob URLs; click chip name to
 *                           open the file in a new tab (previews if the
 *                           browser can render it, downloads otherwise).
 *                           No upload — files vanish on reload, matching the
 *                           spec's "hold locally until Send" first pass.
 */
export function NewChatPage() {
  const navigate = useNavigate()
  const user = useUser()
  const [meResult, setMeResult] = useState<MeResult | null>(null)
  const [files, setFiles] = useState<AttachedFile[]>([])

  // Revoke every still-attached blob URL on unmount so their Blob objects can
  // be GC'd. Individual removal already revokes as it goes; this handles the
  // "user navigates away with files still attached" case.
  const filesRef = useRef<AttachedFile[]>([])
  useEffect(() => {
    filesRef.current = files
  }, [files])
  useEffect(
    () => () => filesRef.current.forEach((f) => URL.revokeObjectURL(f.previewUrl)),
    [],
  )

  const handleLogout = async () => {
    try {
      // httpClient attaches the Bearer token + credentials automatically.
      await httpClient.post('/auth/logout')
    } catch {
      // Network hiccup or 401 — proceed with client-side sign-out regardless;
      // the server session either wasn't valid or will time out on its own.
    }
    useAuthStore.getState().clear()
    navigate('/login', { replace: true })
  }

  // Raw fetch here (not httpClient) so we can surface the raw status code —
  // useful while dogfooding the auth flow. Real app code uses httpClient.
  const handleMe = async () => {
    setMeResult(null)
    const token = useAuthStore.getState().accessToken
    try {
      const res = await fetch(`${env.apiBaseUrl}/auth/me`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      })
      const body = await res.json().catch(() => null)
      setMeResult({ status: res.status, body })
    } catch (err) {
      setMeResult({
        status: 0,
        body: null,
        error: err instanceof Error ? err.message : 'Request failed',
      })
    }
  }

  const handlePick = (list: FileList | null) => {
    if (!list) return
    const next: AttachedFile[] = Array.from(list).map((file) => ({
      key: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }))
    setFiles((prev) => [...prev, ...next])
  }

  const handleRemove = (key: string) => {
    setFiles((prev) => {
      const removed = prev.find((f) => f.key === key)
      if (removed) URL.revokeObjectURL(removed.previewUrl)
      return prev.filter((f) => f.key !== key)
    })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-10">
      <h1 className="font-mono text-2xl uppercase tracking-[0.3em] text-heading">Chat</h1>

      <section className="rounded-2xl border border-divider bg-surface/60 p-6">
        <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-body">Current user</h2>
        <pre className="mt-3 overflow-x-auto text-xs text-heading">
          {user ? JSON.stringify(user, null, 2) : '— no user in store —'}
        </pre>
      </section>

      {/* TEST SCAFFOLDING — remove when real chat UI ships. */}
      <section className="space-y-4 rounded-2xl border border-divider bg-surface/60 p-6">
        <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-body">Test actions</h2>

        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" leftIcon={<LogOut className="size-4" />} onClick={handleLogout}>
            Logout
          </Button>
          <Button variant="secondary" leftIcon={<User2 className="size-4" />} onClick={handleMe}>
            GET /me
          </Button>
          <label className="cursor-pointer">
            <input
              type="file"
              multiple
              className="sr-only"
              onChange={(e) => {
                handlePick(e.target.files)
                e.target.value = ''
              }}
            />
            <span className="inline-flex h-10 items-center gap-2 rounded-md border border-divider bg-surface px-4 text-sm font-medium text-heading transition-colors hover:bg-hover">
              <Upload className="size-4" />
              Attach files
            </span>
          </label>
        </div>

        {meResult && (
          <div className="rounded-lg border border-divider bg-canvas/40 p-3">
            <div className="text-xs text-body">
              /me → status{' '}
              <span className="font-mono text-heading">{meResult.status || 'network error'}</span>
            </div>
            <pre className="mt-2 overflow-x-auto text-xs text-heading">
              {meResult.error ? meResult.error : JSON.stringify(meResult.body, null, 2)}
            </pre>
          </div>
        )}

        {files.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {files.map((f) => (
              <FileChip key={f.key} file={f} onRemove={() => handleRemove(f.key)} />
            ))}
          </div>
        )}

        {files.length > 0 && (
          <p className="text-xs text-body">
            Click a file name to preview it. Files live only in this tab and vanish on reload.
          </p>
        )}
      </section>
    </div>
  )
}

function FileChip({ file, onRemove }: { file: AttachedFile; onRemove: () => void }) {
  const sizeKb = (file.file.size / 1024).toFixed(1)
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-divider bg-canvas/40 px-3 py-1.5 text-xs text-heading">
      <a
        href={file.previewUrl}
        target="_blank"
        rel="noreferrer"
        className="max-w-[20ch] truncate text-brand transition-colors hover:text-brand-hover"
        title={`${file.file.name} — open in new tab`}
      >
        {file.file.name}
      </a>
      <span className="text-body">
        {file.file.type || '?'} · {sizeKb} KB
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="text-body transition-colors hover:text-heading"
        aria-label="Remove file"
      >
        <X className="size-3" />
      </button>
    </span>
  )
}
