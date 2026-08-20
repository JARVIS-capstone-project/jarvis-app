/**
 * Date formatting for the admin surface.
 *
 * Lives outside the component files because a module that exports both
 * components and plain functions breaks React Fast Refresh — the whole file
 * remounts on edit instead of hot-swapping.
 */

/** "12 Mar 2026" — short, unambiguous across locales, no time-of-day noise. */
export function formatJoined(iso: string): string {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return iso
  return new Date(t).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * "2m ago" / "3h ago" / "1d ago" — answers "is it still happening?", which is
 * the question a security rollup is actually asked. Absolute timestamps make
 * the reader do the subtraction.
 */
export function relTime(iso: string): string {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return iso
  const secs = Math.max(0, (Date.now() - t) / 1000)
  if (secs < 60) return `${Math.round(secs)}s ago`
  if (secs < 3600) return `${Math.round(secs / 60)}m ago`
  if (secs < 86400) return `${Math.round(secs / 3600)}h ago`
  return `${Math.round(secs / 86400)}d ago`
}
