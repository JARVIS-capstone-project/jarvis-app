import { useRef } from 'react'
import { Link } from 'react-router'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, ArrowUpRight, ChevronDown, Terminal } from 'lucide-react'
import { ArcReactor } from '@shared/ui/arc-reactor'
import { HudGrid } from '@shared/ui/hud-grid'

/**
 * Split hero. Left column carries the copy; right column carries the reactor.
 * The old tagline lives on as a decorative signature in the top-right.
 *
 *   ┌───────────────────────────────────────────────┐
 *   │  (nav)                Signature ↗            │
 *   │                       Your very intelligent   │
 *   │  Protocol v1.0        operating system.       │
 *   │                                              │
 *   │  Automate the complex.                       │
 *   │  Amplify the human.    [ ArcReactor ]        │
 *   │                                              │
 *   │  Subtitle …                                  │
 *   │                                              │
 *   │  [ Initialize Access ]   System Overview     │
 *   │                    ↓ Scroll                  │
 *   └───────────────────────────────────────────────┘
 *
 * A 150vh scroll spacer with a sticky content viewport gives the whole hero
 * a scroll-linked parallax reveal:
 *   - Reactor  (slowest)  drifts up slowly across the right column
 *   - Content  (fastest)  the left column moves up faster and fades out
 *
 * useReducedMotion collapses the spacer to a normal-height section with
 * everything frozen in its resting state.
 */
export function HeroSection() {
  const heroRef = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })

  const reactorY = useTransform(scrollYProgress, [0, 1], ['20%', '-45%'])
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '-140%'])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.4, 0.75], [1, 1, 0])

  const staticY = useTransform(scrollYProgress, () => '0%')
  const staticOpacity = useTransform(scrollYProgress, () => 1)

  return (
    <section
      ref={heroRef}
      style={{ perspective: '1600px', transformStyle: 'preserve-3d' }}
      className={
        reduce
          ? 'relative overflow-hidden bg-canvas'
          : 'relative h-[150vh] bg-canvas'
      }
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        <HudGrid />

        {/* Top-right signature — the acronym expansion as a decorative
            corner tag. Desktop only; the nav owns mobile top real-estate. */}
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none absolute right-8 top-28 z-20 hidden max-w-[260px] text-right md:block"
        >
          <div className="flex items-center justify-end gap-2 font-mono text-[10px] uppercase tracking-[0.35em] text-subtle">
            <span className="hud-flicker">Designation</span>
            <ArrowUpRight className="size-3 text-brand" aria-hidden="true" />
          </div>
          <p className="mt-2 font-mono text-[11px] uppercase leading-relaxed tracking-[0.3em] text-brand drop-shadow-[0_0_12px_var(--brand-glow-strong)]">
            Just Actionable Real-time Visibility Intelligent System
          </p>
        </motion.div>

        {/* Reactor — right column on desktop, full-bleed behind on mobile.
            Absolute-positioned so its rings can spill past the column edge. */}
        <motion.div
          style={{ y: reduce ? staticY : reactorY }}
          className="absolute inset-0 md:left-auto md:w-3/5"
        >
          <ArcReactor />
        </motion.div>

        {/* Content column — left on desktop, centered on mobile. */}
        <motion.div
          style={{
            y: reduce ? staticY : contentY,
            opacity: reduce ? staticOpacity : contentOpacity,
          }}
          className="relative z-10 flex h-full items-center px-6 md:px-16 lg:px-24"
        >
          <div className="mx-auto w-full max-w-xl text-center md:mx-0 md:text-left">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.35em] text-brand shadow-[0_0_16px_var(--brand-glow-strong)]"
            >
              <Terminal className="size-3" aria-hidden="true" />
              Banking Incident Triage · v1
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 font-display text-4xl leading-[1.05] text-heading sm:text-5xl md:text-6xl lg:text-7xl"
            >
              Triage the incident.
              <br />
              <span className="text-brand drop-shadow-[0_0_28px_var(--brand-glow-strong)]">
                Cite the source.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.65 }}
              className="mt-6 max-w-md text-sm leading-relaxed text-muted sm:text-base"
            >
              AI-driven decision support for HCL Tech banking operations.
              J.A.R.V.I.S turns plain-language incident descriptions into
              streamed, cited triage recommendations — the system suggests,
              humans act.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.85, ease: [0.16, 1, 0.3, 1] }}
              className="mt-10 flex flex-wrap items-center justify-center gap-3 md:justify-start"
            >
              <Link
                to="/login"
                className="group inline-flex items-center gap-2 rounded-sm bg-brand px-6 py-3 font-mono text-xs uppercase tracking-[0.3em] text-white shadow-[0_0_24px_var(--brand-shadow)] transition-all hover:bg-brand-hover hover:shadow-[0_0_36px_var(--brand-shadow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas cursor-pointer"
              >
                Initialize Access
                <ArrowRight
                  className="size-3.5 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
              <a
                href="#capabilities"
                className="inline-flex items-center gap-2 rounded-sm border border-divider bg-surface/50 px-6 py-3 font-mono text-xs uppercase tracking-[0.3em] text-body backdrop-blur-sm transition-all hover:border-brand/50 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand cursor-pointer"
              >
                System Overview
              </a>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll cue */}
        {!reduce && (
          <motion.a
            href="#capabilities"
            aria-label="Scroll to capabilities"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.35em] text-muted transition-colors hover:text-brand"
          >
            <span className="flex flex-col items-center gap-1">
              Scroll
              <ChevronDown className="size-3 animate-bounce" aria-hidden="true" />
            </span>
          </motion.a>
        )}
      </div>
    </section>
  )
}
