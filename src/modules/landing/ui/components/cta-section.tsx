import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { ArrowRight, Zap } from 'lucide-react'

/**
 * Closing section — one hero-scale CTA to punch the reader into /login.
 * Uses a tight radial bloom + faint corner brackets to echo the hero
 * without redrawing the whole reactor.
 */
export function CtaSection() {
  return (
    <section
      id="protocol"
      className="relative overflow-hidden bg-canvas px-4 py-24 md:py-32"
    >
      {/* Radial bloom — cheap way to imply the reactor is off-screen behind us. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, var(--brand-glow-strong) 0%, transparent 55%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto flex max-w-3xl flex-col items-center text-center"
      >
        {/* Framing corner brackets around the CTA block. */}
        <div className="relative w-full rounded-sm border border-divider bg-surface/30 px-6 py-14 backdrop-blur-sm md:px-10 md:py-20">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -left-2 -top-2 size-5 border-l-2 border-t-2 border-brand drop-shadow-[0_0_6px_var(--brand-glow-strong)]"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-2 -top-2 size-5 border-r-2 border-t-2 border-brand drop-shadow-[0_0_6px_var(--brand-glow-strong)]"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-2 -left-2 size-5 border-b-2 border-l-2 border-brand drop-shadow-[0_0_6px_var(--brand-glow-strong)]"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-2 -right-2 size-5 border-b-2 border-r-2 border-brand drop-shadow-[0_0_6px_var(--brand-glow-strong)]"
          />

          <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.35em] text-brand">
            <Zap className="size-3" aria-hidden="true" />
            Operator session ready
          </span>
          <h2 className="mt-4 font-display text-3xl leading-tight text-heading sm:text-4xl md:text-5xl">
            Ready to triage.
          </h2>
          <p className="mt-4 text-sm text-muted sm:text-base">
            Sign in with your operator credentials. Sub-3s SSE round trips.
            Every turn cited and audited — decision support, never autonomous
            action.
          </p>

          <Link
            to="/login"
            className="group mt-10 inline-flex items-center gap-2 rounded-sm bg-brand px-6 py-3 font-mono text-xs uppercase tracking-[0.3em] text-white shadow-[0_0_24px_var(--brand-shadow)] transition-all hover:bg-brand-hover hover:shadow-[0_0_36px_var(--brand-shadow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas cursor-pointer"
          >
            Initialize Access
            <ArrowRight
              className="size-3.5 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>

        <p
          aria-hidden="true"
          className="mt-10 font-mono text-[10px] uppercase tracking-[0.4em] text-subtle"
        >
          J . A . R . V . I . S · Just Actionable Real-time Visibility Intelligent System
        </p>
      </motion.div>
    </section>
  )
}
