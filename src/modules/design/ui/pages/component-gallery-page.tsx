import { useTheme } from '@app/providers/theme-context'
import { BrandMark } from '@shared/ui/brand-mark'
import { ComponentCard } from '@modules/design/ui/components/component-card'
import { componentRegistry } from '@modules/design/ui/data/component-registry'

/**
 * Public `design/component` gallery — every shared UI component with live,
 * editable props so devs can preview variants and copy usage. Theme follows the
 * global ThemeProvider (the `.dark` class on <html>), so the toggle here and the
 * one on the landing page stay in sync and persist across navigation.
 */
export function ComponentGalleryPage() {
  const { theme, toggle } = useTheme()

  return (
    <div className="min-h-screen bg-canvas text-body">
      {/* Sticky theme toggle — drives the app-wide theme, reachable while scrolling. */}
      <button
        type="button"
        onClick={toggle}
        className="fixed right-6 top-6 z-50 rounded-full border border-divider bg-surface px-4 py-2 text-sm font-semibold text-heading shadow-lg"
      >
        {theme === 'dark' ? '☀ Light' : '☾ Dark'}
      </button>

      <div className="mx-auto max-w-4xl px-6 py-16">
        <header className="mb-10">
          <BrandMark className="h-10 drop-shadow-[0_0_16px_var(--brand-glow-strong)]" />
          <div className="mt-4 text-[11px] font-semibold uppercase tracking-[3px] text-brand">
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
  )
}
