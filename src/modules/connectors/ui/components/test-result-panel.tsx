import { CheckCircle2, XCircle } from 'lucide-react'
import type { ConnectionTestResult } from '@modules/connectors/api/mcp-connections-service'

/**
 * Outcome of a handshake against the server.
 *
 * `POST /test` always answers 200 — a server that is down is a configuration
 * problem to show the user, not an exception to throw — so both branches here
 * are ordinary results.
 *
 * The failure branch does **not** print the platform's `error` string as its
 * message. Per `FE_HANDOFF.md` §10, an unreachable host currently comes back
 * as `"unhandled errors in a TaskGroup (1 sub-exception)"` — an asyncio
 * artifact that tells a user nothing and reads like a crash in our own app.
 * A written sentence leads; the raw string stays available, folded away, for
 * whoever is actually debugging the URL.
 */
export function TestResultPanel({ result }: { result: ConnectionTestResult }) {
  if (!result.ok) {
    return (
      <div className="flex flex-col gap-1.5 rounded-md border border-danger/40 bg-danger-soft px-2.5 py-2 text-xs text-danger">
        <span className="flex items-start gap-2">
          <XCircle className="mt-0.5 size-3.5 shrink-0" />
          <span className="min-w-0">
            Couldn&apos;t reach this server. Check the URL and that it is running.
          </span>
        </span>
        {result.error && (
          <details className="pl-5">
            <summary className="cursor-pointer text-[11px] opacity-70 hover:opacity-100">
              Technical details
            </summary>
            <code className="mt-1 block break-words font-mono text-[10px] opacity-70">
              {result.error}
            </code>
          </details>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-success/40 bg-success-soft px-2.5 py-2">
      <div className="flex items-center gap-2 text-xs text-success">
        <CheckCircle2 className="size-3.5 shrink-0" />
        {result.tool_count ?? result.tools.length} tool
        {(result.tool_count ?? result.tools.length) === 1 ? '' : 's'} available
      </div>
      {result.tools.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {result.tools.map((tool) => (
            <code
              key={tool}
              className="rounded bg-panel px-1.5 py-0.5 font-mono text-[10px] text-body"
            >
              {tool}
            </code>
          ))}
        </div>
      )}
    </div>
  )
}
