/**
 * Top status ribbon — flavor text that sells the "system boot" fantasy.
 * Monospace, uppercase, wide tracking. Corner tags on each side.
 */
export function HudStatusBar() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-6 py-4 font-mono text-[10px] uppercase tracking-[0.3em] text-brand"
    >
      <div className="flex items-center gap-3">
        <span className="hud-pulse inline-block size-1.5 rounded-full bg-brand shadow-[0_0_8px_var(--brand)]" />
        <span>System · Online</span>
      </div>

      <div className="hidden gap-6 md:flex">
        <span className="hud-flicker">Node · 001</span>
        <span>Sector · 07</span>
        <span>Uplink · Secure</span>
      </div>

      <div className="flex items-center gap-3">
        <span>Auth · Standby</span>
        <span className="hud-pulse inline-block size-1.5 rounded-full bg-brand shadow-[0_0_8px_var(--brand)]" />
      </div>
    </div>
  )
}
