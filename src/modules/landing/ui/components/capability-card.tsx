import { motion } from 'framer-motion'
import type { Capability } from '@modules/landing/ui/data/capability-list'

/**
 * A single HUD-styled feature tile. Corner brackets + monospace code label
 * ape the target-lock frame from the login screen so the whole product
 * feels visually consistent.
 */
export function CapabilityCard({ capability, index }: { capability: Capability; index: number }) {
  const Icon = capability.icon
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className="group relative overflow-hidden rounded-sm border border-divider bg-surface/40 p-6 backdrop-blur-sm transition-all hover:border-brand/60 hover:bg-surface/60 hover:shadow-[0_0_28px_var(--brand-glow-strong)]"
    >
      {/* Corner brackets — brand-tinted target-lock frame, revealed on hover. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-2 top-2 size-3 border-l border-t border-brand/60 opacity-0 transition-opacity group-hover:opacity-100"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-2 top-2 size-3 border-r border-t border-brand/60 opacity-0 transition-opacity group-hover:opacity-100"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-2 left-2 size-3 border-b border-l border-brand/60 opacity-0 transition-opacity group-hover:opacity-100"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-2 right-2 size-3 border-b border-r border-brand/60 opacity-0 transition-opacity group-hover:opacity-100"
      />

      <div className="flex items-center justify-between">
        <div className="grid size-10 place-items-center rounded-sm border border-brand/40 bg-brand/5 text-brand shadow-[0_0_16px_var(--brand-glow-strong)]">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-subtle">
          {capability.code}
        </span>
      </div>

      <h3 className="mt-5 font-display text-xl text-heading">{capability.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{capability.description}</p>
    </motion.article>
  )
}
