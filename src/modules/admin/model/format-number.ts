/**
 * Number formatting for the admin surface.
 *
 * Separate from the component files because a module exporting both
 * components and plain functions breaks React Fast Refresh — the whole file
 * remounts on edit instead of hot-swapping.
 */

/** 1.2M / 340.0k / 812 — a raw 1204887 is unreadable at a glance. */
export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}
