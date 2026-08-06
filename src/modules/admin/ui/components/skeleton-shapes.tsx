import { cn } from '@shared/lib/cn'

/**
 * Skeleton primitives — thin wrappers over Tailwind's `animate-pulse` so
 * every placeholder in the admin surface pulses at the same cadence and
 * uses the same surface color. `prefers-reduced-motion` is honored via
 * Tailwind's motion-safe/motion-reduce (animate-pulse itself pauses in
 * reduce mode via the utility).
 */
export function SkeletonBar({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded-sm bg-surface', className)}
    />
  )
}

export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded-md bg-surface', className)}
    />
  )
}

/** Placeholder that mirrors a compact <AuditSessionCard> — no text previews. */
export function AuditSessionCardSkeleton() {
  return (
    <div
      aria-hidden
      className="flex flex-col gap-3 rounded-xl border border-divider bg-panel p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2">
          <SkeletonBar className="h-3 w-24" />
          <SkeletonBar className="h-2 w-32" />
        </div>
        <SkeletonBar className="h-4 w-24" />
      </div>
      <div className="mt-auto flex flex-col gap-3">
        <div className="space-y-1">
          <SkeletonBar className="h-2 w-16" />
          <SkeletonBar className="h-2 w-full" />
        </div>
        <div className="space-y-1">
          <SkeletonBar className="h-2 w-16" />
          <SkeletonBar className="h-2 w-full" />
        </div>
      </div>
    </div>
  )
}

/** Placeholder for the summary card (col-span-2). Mirrors AuditSummaryCard. */
export function AuditSummaryCardSkeleton() {
  return (
    <div
      aria-hidden
      className="flex flex-col gap-4 rounded-xl border border-divider bg-panel p-4 md:col-span-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-2">
          <SkeletonBar className="h-2 w-16" />
          <SkeletonBar className="h-3 w-32" />
          <SkeletonBar className="h-2 w-40" />
        </div>
        <div className="space-y-2">
          <SkeletonBar className="h-4 w-24" />
          <SkeletonBar className="h-6 w-40" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <SkeletonBlock key={i} className="h-24" />
        ))}
      </div>
    </div>
  )
}

/**
 * Skeleton grid mimicking a first-load audit bento — 1 summary card + 3 compact
 * cards. Renders inside the same grid classes the real page uses so alignment
 * doesn't jump when the real cards mount.
 */
export function AuditBentoSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:auto-rows-fr lg:grid-cols-4">
      <AuditSummaryCardSkeleton />
      <AuditSessionCardSkeleton />
      <AuditSessionCardSkeleton />
      <AuditSessionCardSkeleton />
    </div>
  )
}

/** Skeleton for the Health card body (dot + info tiles). */
export function HealthCardSkeleton() {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-8">
      <div className="flex items-center gap-4">
        <SkeletonBlock className="size-14 rounded-full" />
        <div className="space-y-2">
          <SkeletonBar className="h-4 w-32" />
          <SkeletonBar className="h-2 w-40" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <SkeletonBlock key={i} className="h-12 w-28" />
        ))}
      </div>
    </div>
  )
}

/** Skeleton table rows for the metrics counters + timers cards. */
export function MetricsTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="mt-3 overflow-hidden rounded-md border border-divider">
      <div className="border-b border-divider bg-surface px-3 py-2">
        <SkeletonBar className="h-2 w-24" />
      </div>
      <div className="space-y-0">
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            className="flex items-center justify-between border-b border-divider px-3 py-2 last:border-b-0"
          >
            <SkeletonBar className="h-3 w-1/2" />
            <SkeletonBar className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
