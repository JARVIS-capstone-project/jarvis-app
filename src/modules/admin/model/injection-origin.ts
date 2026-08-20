import type { AuditRow } from '@modules/admin/api/admin-audit-service'

/**
 * `injection_flags[].origin` decides who is responsible, and that distinction is
 * the whole point of the detection screen.
 *
 *   user:message        → the account TYPED the payload        → ban evidence
 *   attachment:{id}     → it read a poisoned file
 *   mcp:{conn}/{tool}   → it read a poisoned tool result
 *   mcp-tool:{c}/{t}    → a poisoned tool *description*
 *
 * Only the first means the user attacked. The rest mean the user was targeted
 * by something it merely read. The `/admin/audit/injections/summary` rollup
 * counts all of them together, so anything ranking users has to re-establish
 * this split itself — otherwise an admin bans the victim.
 */
const USER_PREFIX = 'user:'

/** True when at least one flag on the turn came from the message the user typed. */
export function typedByUser(row: AuditRow): boolean {
  return (row.injection_flags ?? []).some((f) =>
    String(f?.origin ?? '').startsWith(USER_PREFIX),
  )
}

/** Distinct scanner labels across every flag on the turn, sorted for stable render. */
export function rowPatterns(row: AuditRow): string[] {
  const out = new Set<string>()
  for (const f of row.injection_flags ?? []) {
    for (const p of f?.patterns ?? []) out.add(p)
  }
  return [...out].sort()
}

/**
 * `mcp:jira/get_issue` → `jira/get_issue`, `attachment:{uuid}` → `attachment`.
 * The connection/tool pair is worth showing (it names the poisoned source);
 * a bare uuid is not, so it is dropped rather than truncated into noise.
 */
export function originLabel(origin: string): string {
  if (origin.startsWith('attachment:')) return 'attachment'
  const mcp = /^mcp(?:-tool)?:(.+)$/.exec(origin)
  return mcp ? mcp[1] : origin
}

/** Readable labels for the turn's non-user origins — empty when the user typed it. */
export function contentOrigins(row: AuditRow): string[] {
  const out = new Set<string>()
  for (const f of row.injection_flags ?? []) {
    const origin = String(f?.origin ?? '')
    if (origin && !origin.startsWith(USER_PREFIX)) out.add(originLabel(origin))
  }
  return [...out].sort()
}
