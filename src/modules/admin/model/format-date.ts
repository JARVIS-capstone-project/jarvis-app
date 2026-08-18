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
