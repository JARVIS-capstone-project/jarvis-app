import { LandingNav } from '@modules/landing/ui/components/landing-nav'
import { HeroSection } from '@modules/landing/ui/components/hero-section'
import { CapabilitiesSection } from '@modules/landing/ui/components/capabilities-section'
import { CtaSection } from '@modules/landing/ui/components/cta-section'

/**
 * The /landing screen — J.A.R.V.I.S marketing entry.
 *
 * Full-bleed, dark-mode-locked so the HUD/reactor aesthetic reads correctly
 * regardless of the app's active theme (marketing pages own their palette).
 *
 * Composition:
 *   - <LandingNav>           fixed top bar, brand + section anchors + /login CTA
 *   - <HeroSection>          full-viewport hero with ArcReactor as backdrop
 *   - <CapabilitiesSection>  six HUD feature tiles
 *   - <CtaSection>           closing CTA into /login
 */
export function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-canvas text-body">
      <LandingNav />
      <main>
        <HeroSection />
        <CapabilitiesSection />
        <CtaSection />
      </main>
    </div>
  )
}
