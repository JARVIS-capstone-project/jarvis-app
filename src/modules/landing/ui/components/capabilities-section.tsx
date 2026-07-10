import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { CapabilityCard } from '@modules/landing/ui/components/capability-card'
import { capabilities } from '@modules/landing/ui/data/capability-list'

/**
 * "Capabilities" — the feature grid.
 *
 * Parallax push: the whole section starts translated 50% upward from its
 * natural position and settles to 0 as it enters the viewport. Combined
 * with the hero's rising reactor, this reads as the grid "shoving" the
 * hero out of frame instead of a passive scroll-in.
 *
 * Cards keep their per-card `whileInView` stagger — it fires after the
 * push settles (viewport margin trigger), so the two animations don't
 * fight each other.
 *
 * useReducedMotion collapses the push to a static position.
 */
export function CapabilitiesSection() {
  const capsRef = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()

  const { scrollYProgress } = useScroll({
    target: capsRef,
    offset: ['start end', 'start start'],
  })

  // Section arrives half-offset upward, resolves to natural spot as it enters.
  const pushY = useTransform(scrollYProgress, [0, 1], ['50%', '0%'])
  const staticY = useTransform(scrollYProgress, () => '0%')

  return (
    <section
      ref={capsRef}
      id="capabilities"
      className="relative z-10 overflow-hidden bg-canvas px-4 py-24 md:py-32"
    >
      {/* Faint grid + top/bottom divider lines to seam this section into the hero. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--brand) 1px, transparent 1px),
            linear-gradient(to bottom, var(--brand) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
        }}
      />

      <motion.div
        style={{ y: reduce ? staticY : pushY }}
        className="relative mx-auto max-w-6xl"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center text-center"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-brand">
            // Non-negotiables · six invariants
          </span>
          <h2 className="mt-4 max-w-2xl font-display text-3xl leading-tight text-heading sm:text-4xl md:text-5xl">
            Six invariants. Zero compromises.
          </h2>
          <p className="mt-4 max-w-xl text-sm text-muted sm:text-base">
            The safety properties enforced in deterministic code — not toggles,
            not aspirations. Every turn respects them.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((c, i) => (
            <CapabilityCard key={c.code} capability={c} index={i} />
          ))}
        </div>
      </motion.div>
    </section>
  )
}
