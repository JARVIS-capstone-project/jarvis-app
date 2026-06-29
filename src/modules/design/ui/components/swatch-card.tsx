import type { Swatch, Theme } from '@modules/design/ui/data/color-tokens'
import { inter, interSemi, menlo } from '@modules/design/ui/data/color-tokens'

type Props = {
  swatch: Swatch
  copied: boolean
  onCopy: (v: string) => void
  t: Theme
}

/** A single clickable color tile; click copies the raw value to clipboard. */
export function SwatchCard({ swatch, copied, onCopy, t }: Props) {
  return (
    <button
      onClick={() => onCopy(swatch.value)}
      className="flex flex-col text-left overflow-hidden rounded-2xl transition-transform hover:-translate-y-0.5"
      style={{ border: `1px solid ${t.border}`, background: t.panel }}
    >
      <div className="h-[88px] w-full" style={{ background: swatch.value }} />
      <div className="px-4 py-3">
        <div style={{ ...interSemi, color: t.heading, fontSize: 13, lineHeight: '17.875px' }}>
          {swatch.name}
        </div>
        <div style={{ ...menlo, color: t.muted, fontSize: 11, lineHeight: '15.125px', marginTop: 2 }}>
          {copied ? 'copied!' : swatch.token}
        </div>
        <div style={{ ...inter, color: t.body, fontSize: 11, lineHeight: '15.125px', marginTop: 4 }}>
          {swatch.usage}
        </div>
      </div>
    </button>
  )
}
