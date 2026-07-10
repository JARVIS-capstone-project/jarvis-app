/**
 * HUD background grid + slow scanline. Sits below foreground scene elements,
 * giving the whole screen a "projected surface" feel. Pure CSS, no JS.
 */
export function HudGrid() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Grid lines — repeating linear gradients tinted with the brand color. */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--brand) 1px, transparent 1px),
            linear-gradient(to bottom, var(--brand) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }}
      />

      {/* Sweeping scanline — a single translucent bar drifting top-to-bottom. */}
      <div
        className="hud-scanline absolute inset-x-0 h-[2px]"
        style={{
          background:
            'linear-gradient(to bottom, transparent, var(--brand-glow-strong), transparent)',
        }}
      />

      {/* Vignette — darkens the edges so the center feels lit up. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, var(--canvas) 100%)',
        }}
      />
    </div>
  )
}
