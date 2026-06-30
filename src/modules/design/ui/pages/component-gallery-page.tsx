import { useState } from 'react'
import { cn } from '@shared/lib/cn'
import { ComponentCard } from '@modules/design/ui/components/component-card'
import { componentRegistry } from '@modules/design/ui/data/component-registry'

/**
 * Public `design/component` gallery — every shared UI component with live,
 * editable props so devs can preview variants and copy usage. The `dark` class
 * on the wrapper drives the token swap, so previews dogfood the real theme.
 */
export function ComponentGalleryPage() {
  const [dark, setDark] = useState(false)

  return (
    <div className={cn('min-h-screen', dark ? 'dark' : 'light')}>
      <div className="min-h-screen bg-canvas text-body">
        {/* Sticky theme toggle — stays reachable while scrolling. */}
        <button
          type="button"
          onClick={() => setDark((d) => !d)}
          className="fixed right-6 top-6 z-50 rounded-full border border-divider bg-surface px-4 py-2 text-sm font-semibold text-heading shadow-lg"
        >
          {dark ? '☀ Light' : '☾ Dark'}
        </button>

        <div className="mx-auto max-w-4xl px-6 py-16">
          <header className="mb-10">
            <div className="text-[11px] font-semibold uppercase tracking-[3px] text-brand">
              J.A.R.V.I.S Design System
            </div>
            <h1 className="mt-3 font-display text-4xl text-heading">Components</h1>
            <p className="mt-2 max-w-xl text-sm text-muted">
              Every shared UI component, with editable props. Tweak the controls to preview each
              variant and copy the generated usage snippet.
            </p>
          </header>

          <div className="space-y-8">
            {componentRegistry.map((demo) => (
              <ComponentCard key={demo.name} demo={demo} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
