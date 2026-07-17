import { BrandMark } from '@shared/ui/brand-mark'

interface WelcomeHeroProps {
  /** Displayed after "Welcome Back," — hardcoded until /auth/me is wired. */
  userName?: string
}

/**
 * Empty-state hero shown when the thread has no messages. Anchors the
 * JARVIS mark + wordmark and a personalized greeting. Collapses out as
 * soon as the first message is sent — see chat-section.tsx.
 */
export function WelcomeHero({ userName = 'Avenger' }: WelcomeHeroProps) {
  return (
    <div className="flex flex-col items-center gap-6 px-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <BrandMark className="h-16 w-auto" />
        <span className="font-mono text-sm uppercase tracking-[0.4em] text-brand">
          J.A.R.V.I.S
        </span>
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-semibold text-heading">Welcome Back, {userName}</p>
        <p className="text-2xl text-heading">How can I assist you</p>
      </div>
    </div>
  )
}
