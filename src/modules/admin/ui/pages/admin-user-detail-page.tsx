import { useState } from 'react'
import { useParams } from 'react-router'
import { adminUsersService } from '@modules/admin/api/admin-users-service'
import { useEndpoint } from '@modules/admin/model/use-endpoint'
import { EndpointBlock } from '@modules/admin/ui/components/endpoint-block'
import { JsonDump } from '@modules/admin/ui/components/json-dump'

/**
 * `/admin/users/:id` — dumps the user resource, plus a minimal PUT form that
 * takes a raw jobRole string and dumps the response. Real editor UI later.
 */
export function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data, error, loading, refetch } = useEndpoint(
    () => (id ? adminUsersService.get(id) : Promise.resolve(null)),
    [id],
  )

  const [jobRole, setJobRole] = useState('')
  const [putState, setPutState] = useState<{
    data: unknown
    error: string | null
    submitting: boolean
  }>({ data: null, error: null, submitting: false })

  const submitPut = async () => {
    if (!id || !jobRole.trim()) return
    setPutState({ data: null, error: null, submitting: true })
    try {
      const res = await adminUsersService.updateJobRole(id, jobRole.trim())
      setPutState({ data: res, error: null, submitting: false })
      refetch()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setPutState({ data: null, error: message, submitting: false })
    }
  }

  return (
    <div>
      <EndpointBlock
        method="GET"
        path={`/api/admin/users/${id ?? ''}`}
        data={data}
        error={error}
        loading={loading}
        onRefresh={refetch}
      />

      <section className="mb-6">
        <div className="mb-2 flex items-center gap-3">
          <span className="rounded bg-surface px-2 py-0.5 font-mono text-xs uppercase text-heading">
            PUT
          </span>
          <code className="font-mono text-sm text-body">
            /api/admin/users/{id}/job-role
          </code>
        </div>
        <div className="mb-2 flex items-center gap-2">
          <input
            type="text"
            value={jobRole}
            onChange={(e) => setJobRole(e.target.value)}
            placeholder="jobRole (raw string)"
            className="flex-1 rounded-md border border-divider bg-surface px-3 py-1.5 text-sm text-heading placeholder:text-muted focus:outline-none"
          />
          <button
            type="button"
            onClick={submitPut}
            disabled={!jobRole.trim() || putState.submitting}
            className="rounded-md bg-brand px-3 py-1.5 text-sm text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {putState.submitting ? 'Submitting…' : 'Submit'}
          </button>
        </div>
        {putState.error && (
          <div
            role="alert"
            className="rounded-md border border-danger bg-danger/10 px-3 py-2 text-sm text-danger"
          >
            {putState.error}
          </div>
        )}
        {putState.data !== null && (
          <JsonDump data={putState.data} label="Last PUT response" />
        )}
      </section>
    </div>
  )
}
