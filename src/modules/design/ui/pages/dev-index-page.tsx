import { Link } from 'react-router'
import { ArrowRight, Blocks, Palette } from 'lucide-react'
import { BrandMark } from '@shared/ui/brand-mark'
import { Button } from '@shared/ui/button'

/**
 * Dev entry — links devs into the design references (colors + component gallery).
 * Lives at /dev inside the AppLayout shell.
 */
export function DevIndexPage() {
  return (
    <section className="relative flex min-h-[70vh] flex-col items-center justify-center text-center">
      <BrandMark className="h-16 drop-shadow-[0_0_24px_var(--brand-glow-strong)]" />
      <div className="mt-6 text-[11px] font-semibold uppercase tracking-[3px] text-brand">
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
