import { Link } from 'react-router'
import { ArrowRight, Blocks, Moon, Palette, Sun } from 'lucide-react'
import { Button } from '@shared/ui/button'
import { useTheme } from '@app/providers/theme-context'

/**
 * Landing page. For now it routes devs into the two design references;
 * grows into the real product hero later.
 */
export function LandingPage() {
  const { theme, toggle } = useTheme()

  return (
    <section className="relative flex min-h-[70vh] flex-col items-center justify-center text-center">
      {/* Theme switcher — toggles the app-wide .dark class (persisted to storage). */}
      <Button
        variant="secondary"
        onClick={toggle}
        aria-label="Toggle theme"
        leftIcon={theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
        className="absolute right-0 top-0"
      >
        {theme === 'dark' ? 'Light' : 'Dark'}
      </Button>

      <div className="text-[11px] font-semibold uppercase tracking-[3px] text-brand">
        J.A.R.V.I.S Design System
      </div>
      <h1 className="mt-4 font-display text-5xl text-heading">Jarvis App</h1>
      <p className="mt-3 max-w-md text-muted">
        Explore the design foundation — the color tokens and the shared UI
        components that everything is built from.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link to="/design/component">
          <Button
            variant="primary"
            leftIcon={<Blocks className="size-4" />}
            rightIcon={<ArrowRight className="size-4" />}
          >
            View components
          </Button>
        </Link>
        <Link to="/design/color">
          <Button variant="secondary" leftIcon={<Palette className="size-4" />}>
            View colors
          </Button>
        </Link>
      </div>
    </section>
  )
}
