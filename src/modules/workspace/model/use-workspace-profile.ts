import { useEffect, useState } from 'react'
import {
  workspaceService,
  type WorkspaceProfile,
} from '@modules/workspace/api/workspace-service'

interface UseWorkspaceProfileResult {
  data: WorkspaceProfile | null
  loading: boolean
  /** Populated on non-404 failures; a 404 is treated as "no profile yet" and
   *  leaves both `data` and `error` null so the caller can hide the row. */
  error: string | null
}

/**
 * Fetches the caller's workspace-scoped profile once on mount. Mirrors the
 * `useMe` shape but stays lazy — only the surfaces that actually render
 * profile data (Settings > Account) should call this, so we don't pay the
 * cost on every app boot for a modal most users won't open.
 *
 * 404 is expected for accounts that haven't seeded a workspace row yet and is
 * NOT surfaced as an error — the Account tab hides the job-role line when
 * `data` is null.
 */
export function useWorkspaceProfile(): UseWorkspaceProfileResult {
  const [data, setData] = useState<WorkspaceProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const profile = await workspaceService.getProfile()
        if (!cancelled) setData(profile)
      } catch (err) {
        if (cancelled) return
        const msg = err instanceof Error ? err.message : String(err)
        if (msg.includes('404')) return
        setError(msg)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return { data, loading, error }
}
