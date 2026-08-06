import { cn } from '@shared/lib/cn'

/**
 * Provenance pill — every audit card carries one. Two variants only:
 *   - `agent`:    orange (brand), signals "source of truth, real data"
 *   - `platform`: brown/muted, signals "platform mirror (mock today)"
 *
 * Uppercase mono text keeps the HUD/terminal vibe consistent with the rest
 * of the admin surface.
 */
export type Source = 'agent' | 'platform'

interface Props {
  source: Source
  className?: string
}

export function SourceBadge({ source, className }: Props) {
  const isAgent = source === 'agent'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest',
        isAgent
          ? 'border-brand/40 bg-brand-glow-strong text-brand'
          : 'border-divider bg-surface text-muted',
        className,
      )}
    >
      <span
        className={cn(
          'inline-block size-1.5 rounded-full',
          isAgent ? 'bg-brand' : 'bg-muted',
        )}
      />
      {isAgent ? 'agent-system' : 'platform-system'}
    </span>
  )
}
