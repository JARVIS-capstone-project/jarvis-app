import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@shared/lib/cn'

/**
 * Compact pagination controls: page-size dropdown + Prev / Next + range label.
 * Page is 0-indexed internally (matches offset math).
 *
 * `total` is optional — platform endpoints return `{items, total}` so we can
 * render precise "showing X–Y of N". Agent returns a bare array with no total,
 * so we fall back to "showing X–Y" and derive `hasNext` from the last fetch's
 * item count vs the requested `pageSize`.
 */
interface Props {
  pageSize: number
  page: number
  itemsThisPage: number
  total?: number | null
  loading: boolean
  onPageSizeChange: (n: number) => void
  onPageChange: (n: number) => void
  className?: string
}

const PAGE_SIZES = [20, 50, 100] as const

export function PaginationBar({
  pageSize,
  page,
  itemsThisPage,
  total,
  loading,
  onPageSizeChange,
  onPageChange,
  className,
}: Props) {
  const start = page * pageSize + 1
  const end = page * pageSize + itemsThisPage
  const hasKnownTotal = typeof total === 'number'
  const hasNext = hasKnownTotal ? end < total : itemsThisPage >= pageSize
  const isPrevDisabled = page === 0 || loading
  const isNextDisabled = !hasNext || loading

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-md border border-divider bg-surface px-3 py-2',
        className,
      )}
    >
      <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted">
        Per page
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          disabled={loading}
          className="rounded border border-divider bg-panel px-2 py-0.5 font-mono text-xs text-heading focus:outline-none disabled:opacity-50"
        >
          {PAGE_SIZES.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>

      <div className="ml-auto flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted">
        {itemsThisPage === 0 ? (
          <span>no items</span>
        ) : (
          <span>
            {start}–{end}
            {hasKnownTotal && ` of ${total}`}
          </span>
        )}
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={isPrevDisabled}
          aria-label="Previous page"
          className="flex size-7 items-center justify-center rounded border border-divider bg-panel text-body transition-colors hover:bg-hover hover:text-heading disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={isNextDisabled}
          aria-label="Next page"
          className="flex size-7 items-center justify-center rounded border border-divider bg-panel text-body transition-colors hover:bg-hover hover:text-heading disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
