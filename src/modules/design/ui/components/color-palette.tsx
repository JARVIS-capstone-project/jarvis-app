import { useState } from 'react'
import { SwatchCard } from '@modules/design/ui/components/swatch-card'
import { TokensTable } from '@modules/design/ui/components/tokens-table'
import {
  DARK,
  LIGHT,
  darkSections,
  heroBlocksDark,
  heroBlocksLight,
  inter,
  instrument,
  interSemi,
  lightSections,
  menlo,
} from '@modules/design/ui/data/color-tokens'

const sectionLabel = (color: string) => ({
  ...interSemi,
  color,
  fontSize: 11,
  letterSpacing: '2px',
  textTransform: 'uppercase' as const,
  marginBottom: 16,
})

/** Full catalog of the J.A.R.V.I.S palette for one mode. Click swatches to copy. */
export function ColorPalette({ mode }: { mode: 'light' | 'dark' }) {
  const isDark = mode === 'dark'
  const t = isDark ? DARK : LIGHT
  const sections = isDark ? darkSections : lightSections
  const heroBlocks = isDark ? heroBlocksDark : heroBlocksLight
  const [copied, setCopied] = useState<string | null>(null)

  const copy = (v: string) => {
    navigator.clipboard?.writeText(v).catch(() => {})
    setCopied(v)
    setTimeout(() => setCopied(null), 1200)
  }

  const allTokens = sections.flatMap((s) => s.swatches)

  return (
    <div className="min-h-screen w-full" style={{ background: t.bg }}>
      <div className="mx-auto" style={{ maxWidth: 976, padding: '64px 24px 96px' }}>
        {/* Header */}
        <div style={{ ...interSemi, color: t.accent, fontSize: 11, letterSpacing: '3px', textTransform: 'uppercase' }}>
          J.A.R.V.I.S Design System{isDark ? ' — Dark Mode' : ''}
        </div>
        <h1 style={{ ...instrument, color: t.heading, fontSize: 48, lineHeight: '60px', letterSpacing: '1px', margin: '12px 0' }}>
          {isDark ? 'Dark Color Palette' : 'Color Palette'}
        </h1>
        <p style={{ ...inter, color: t.muted, fontSize: 15, lineHeight: '24.375px', maxWidth: 576 }}>
          {isDark
            ? 'Warm darks — rust-cast grays built to keep the same earthy character as the light theme while being easy on the eyes at night. Click any swatch to copy its value.'
            : 'A warm, earthy palette built on brown + orange — grounded in comfort, lit by intent. Click any swatch to copy its value.'}
        </p>

        {/* Hero strip */}
        <div className="flex overflow-hidden mt-3" style={{ height: 40, borderRadius: 16, width: '100%' }}>
          {heroBlocks.map((c, i) => (
            <div key={i} className="flex-1" style={{ background: c }} />
          ))}
        </div>

        <div style={{ height: 1, background: t.divider, margin: '48px 0 32px' }} />

        {/* Sections */}
        {sections.map((section, idx) => (
          <div key={section.title}>
            <div style={sectionLabel(t.muted)}>{section.title}</div>
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${section.cols}, minmax(0, 1fr))` }}>
              {section.swatches.map((s) => (
                <SwatchCard key={s.name} swatch={s} copied={copied === s.value} onCopy={copy} t={t} />
              ))}
            </div>
            {idx < sections.length - 1 && (
              <div style={{ height: 1, background: t.divider, margin: '40px 0 32px' }} />
            )}
          </div>
        ))}

        {/* All tokens table */}
        <div style={{ height: 1, background: t.divider, margin: '48px 0 32px' }} />
        <div style={sectionLabel(t.muted)}>All tokens</div>
        <TokensTable tokens={allTokens} t={t} />

        <div style={{ ...menlo, color: t.muted, fontSize: 11, textAlign: 'center', marginTop: 48 }}>
          J.A.R.V.I.S — Color Palette Catalog · Extracted from Figma
        </div>
      </div>
    </div>
  )
}
