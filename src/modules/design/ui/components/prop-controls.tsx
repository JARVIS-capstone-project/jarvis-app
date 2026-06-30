import { cn } from '@shared/lib/cn'
import type { Control, PropBag } from '@modules/design/ui/data/component-registry'

type Props = {
  controls: Control[]
  values: PropBag
  onChange: (prop: string, value: string | boolean) => void
}

/** Renders an editor for each control: a <select> for unions, a toggle for flags. */
export function PropControls({ controls, values, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-4">
      {controls.map((c) => (
        <label key={c.prop} className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">{c.prop}</span>
          {c.type === 'select' ? (
            <select
              value={String(values[c.prop])}
              onChange={(e) => onChange(c.prop, e.target.value)}
              className="rounded-md border border-divider bg-surface px-2 py-1 text-sm text-body"
            >
              {c.options.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ) : c.type === 'text' ? (
            <input
              type="text"
              value={String(values[c.prop] ?? '')}
              placeholder={c.placeholder}
              onChange={(e) => onChange(c.prop, e.target.value)}
              className="rounded-md border border-divider bg-surface px-2 py-1 text-sm text-body placeholder:text-muted"
            />
          ) : (
            <button
              type="button"
              onClick={() => onChange(c.prop, !values[c.prop])}
              className={cn(
                'rounded-md border px-3 py-1 text-sm transition-colors',
                values[c.prop]
                  ? 'border-brand bg-brand text-white'
                  : 'border-divider bg-surface text-body',
              )}
            >
              {values[c.prop] ? 'on' : 'off'}
            </button>
          )}
        </label>
      ))}
    </div>
  )
}
