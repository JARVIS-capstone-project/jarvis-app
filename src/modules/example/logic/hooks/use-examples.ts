import { useCallback, useEffect, useState } from 'react'
import { fetchExamples } from '@modules/example/logic/api/example-api'
import type { Example } from '@modules/example/logic/models/example'

interface UseExamplesResult {
  data: Example[]
  loading: boolean
  error: string | null
  reload: () => void
}

/**
 * Owns all data-fetching state for the examples feature. The UI layer consumes
 * this hook and stays free of fetch/loading/error plumbing.
 *
 * State updates live in the promise continuations (not synchronously in the
 * effect body) so the fetch-on-mount doesn't trigger cascading renders.
 */
export function useExamples(): UseExamplesResult {
  const [data, setData] = useState<Example[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const reload = useCallback(() => {
    setLoading(true)
    setReloadKey((key) => key + 1)
  }, [])

  useEffect(() => {
    let active = true

    fetchExamples()
      .then((result) => {
        if (!active) return
        setData(result)
        setError(null)
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Unknown error')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [reloadKey])

  return { data, loading, error, reload }
}
