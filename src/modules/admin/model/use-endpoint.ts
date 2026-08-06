import { useEffect, useState } from 'react'

/**
 * Generic "fetch on mount + expose a refetch" hook used across the admin
 * pages while the real UI is deferred. Any fetcher that returns a promise
 * plugs in. Errors are stringified for the UI dump — no domain-specific
 * handling here.
 *
 * `deps` behaves like `useEffect`'s dep list — refetch fires when they change.
 * `refetch()` bumps an internal tick to force a re-run without touching deps.
 *
 * `loading` starts true (initial fetch on mount) and flips false when the
 * async completes. `refetch` sets it true again BEFORE bumping the tick, from
 * the event handler — never inside the effect body (React 19 compiler rule).
 */
interface State<T> {
  data: T | null
  error: string | null
  loading: boolean
}

export interface EndpointResult<T> extends State<T> {
  refetch: () => void
}

export function useEndpoint<T>(
  fetcher: () => Promise<T>,
  deps: readonly unknown[] = [],
): EndpointResult<T> {
  const [state, setState] = useState<State<T>>({
    data: null,
    error: null,
    loading: true,
  })
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await fetcher()
        if (cancelled) return
        setState({ data, error: null, loading: false })
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : String(err)
        setState((prev) => ({ ...prev, error: message, loading: false }))
      }
    })()
    return () => {
      cancelled = true
    }
    // `fetcher` intentionally excluded — callers pass a closure that changes
    // every render; the `deps` array is the trigger contract.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps])

  const refetch = () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    setTick((t) => t + 1)
  }

  return { ...state, refetch }
}
