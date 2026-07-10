import type { ReactNode } from 'react'

/**
 * L-shaped corner brackets around a target region — the classic HUD "target
 * lock" look. Each bracket sits at translateZ(20px) so it floats slightly in
 * front of the card content, catching the reactor light with a glow ring.
 */
export function HudFrame({ children }: { children: ReactNode }) {
  const glow = 'drop-shadow-[0_0_6px_var(--brand-glow-strong)]'
  const lift = { transform: 'translateZ(20px)' }

  return (
    <div className="relative" style={{ transformStyle: 'preserve-3d' }}>
      <span
        aria-hidden="true"
        style={lift}
        className={`pointer-events-none absolute -left-3 -top-3 size-5 border-l-2 border-t-2 border-brand ${glow}`}
      />
      <span
        aria-hidden="true"
        style={lift}
        className={`pointer-events-none absolute -right-3 -top-3 size-5 border-r-2 border-t-2 border-brand ${glow}`}
      />
      <span
        aria-hidden="true"
        style={lift}
        className={`pointer-events-none absolute -bottom-3 -left-3 size-5 border-b-2 border-l-2 border-brand ${glow}`}
      />
      <span
        aria-hidden="true"
        style={lift}
        className={`pointer-events-none absolute -bottom-3 -right-3 size-5 border-b-2 border-r-2 border-brand ${glow}`}
      />
      {children}
    </div>
  )
}
