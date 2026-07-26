import { cn } from '@shared/lib/cn'

/**
 * Placeholder bubbles rendered while `useHydrateSession` is fetching a
 * session's history. Layout mirrors `<ChatMessages>` — alternating left
 * (assistant) / right (user) — so the real messages "snap" into the same
 * positions when hydration finishes (no visual jump).
 *
 * Widths are deliberately varied to hint at natural message length. Each
 * bubble uses the same `bg-surface` + border as the real assistant bubble,
 * so tone matches even when the skeleton stays visible briefly.
 */
export function MessageSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading messages"
      className="flex flex-1 flex-col gap-4 overflow-hidden px-6 py-4"
    >
      <SkeletonBubble side="right" widthClass="w-64" lineCount={2} />
      <SkeletonBubble side="left" widthClass="w-80" lineCount={3} />
      <SkeletonBubble side="right" widthClass="w-40" lineCount={1} />
      <SkeletonBubble side="left" widthClass="w-72" lineCount={2} />
    </div>
  )
}

interface SkeletonBubbleProps {
  side: 'left' | 'right'
  widthClass: string
  lineCount: number
}

function SkeletonBubble({ side, widthClass, lineCount }: SkeletonBubbleProps) {
  const isRight = side === 'right'
  return (
    <div className={cn('flex w-full', isRight ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'flex max-w-[80%] flex-col gap-2 rounded-2xl px-4 py-3',
          isRight
            ? 'bg-brand/20'
            : 'border border-divider bg-surface',
          widthClass,
        )}
      >
        {Array.from({ length: lineCount }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-3 animate-pulse rounded',
              // Real bubbles use text-white on brand and text-heading on
              // surface — use the same tokens at reduced opacity so the
              // shimmer reads as "text about to appear".
              isRight ? 'bg-white/40' : 'bg-muted/40',
              // Last line shorter for natural rag.
              i === lineCount - 1 ? 'w-2/3' : 'w-full',
            )}
          />
        ))}
      </div>
    </div>
  )
}
