import type { UsageTotals } from '@modules/admin/api/admin-usage-service'
import { formatTokens } from '@modules/admin/model/format-number'
import { cn } from '@shared/lib/cn'

/**
 * Where the window's tokens went.
 *
 * **Not a stacked bar, and `cached` is not one of the segments.** The schema
 * calls it "an informational subset of prompt_tokens — not an addend of
 * total_tokens": those tokens are already inside the prompt figure. Stacking
 * the five values would count them twice and inflate the apparent total by
 * however well the cache is working, which is exactly backwards. So each kind
 * gets its own bar measured against the largest, and cached renders indented
 * beneath prompt, in a recessive fill, labelled as a subset.
 *
 * One hue throughout: these are four magnitudes of the same thing, not four
 * identities to tell apart, so color carries no information here and giving
 * each row its own would imply a difference that does not exist.
 */
const ROWS = [
  { key: 'prompt_tokens', label: 'Prompt' },
  { key: 'output_tokens', label: 'Output' },
  { key: 'thinking_tokens', label: 'Thinking' },
  { key: 'tool_tokens', label: 'Tool' },
] as const

export function TokenUsageBars({ totals }: { totals: UsageTotals }) {
  const max = Math.max(
    1,
    totals.prompt_tokens,
    totals.output_tokens,
    totals.thinking_tokens,
    totals.tool_tokens,
  )

  return (
    <div className="flex flex-col gap-2.5">
      {ROWS.map(({ key, label }) => (
        <div key={key}>
          <Bar label={label} value={totals[key]} max={max} />
          {key === 'prompt_tokens' && totals.cached_tokens > 0 && (
            <div className="mt-1.5 pl-4">
              <Bar
                label="↳ cached"
                value={totals.cached_tokens}
                max={max}
                recessive
                note="already counted in Prompt"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function Bar({
  label,
  value,
  max,
  recessive,
  note,
}: {
  label: string
  value: number
  max: number
  recessive?: boolean
  note?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <span
          className={cn(
            'font-mono text-[10px] uppercase tracking-widest',
            recessive ? 'text-muted' : 'text-body',
          )}
        >
          {label}
          {note && <span className="ml-1.5 normal-case tracking-normal">({note})</span>}
        </span>
        <span
          className={cn(
            'font-mono text-xs tabular-nums',
            recessive ? 'text-muted' : 'text-heading',
          )}
        >
          {formatTokens(value)}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-sm bg-surface">
        <div
          className={cn('h-full rounded-sm', recessive ? 'bg-brand/30' : 'bg-brand')}
          style={{ width: `${Math.max(value > 0 ? 2 : 0, (value / max) * 100)}%` }}
        />
      </div>
    </div>
  )
}
