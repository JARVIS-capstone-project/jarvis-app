import { motion } from 'framer-motion'
import { HudGrid } from '@shared/ui/hud-grid'
import { HudFrame } from '@modules/auth/ui/components/hud-frame'
import { HudStatusBar } from '@modules/auth/ui/components/hud-status-bar'
import { ForgotPasswordForm } from '@modules/auth/ui/components/forgot-password-form'

/**
 * The /forgot-password screen. Shares the same HUD chrome as LoginPage +
 * RegisterPage so the identity flow stays cohesive.
 */
export function ForgotPasswordPage() {
  return (
    <main
      style={{
        perspective: '1600px',
        transformStyle: 'preserve-3d',
      }}
      className="relative min-h-screen overflow-hidden bg-canvas"
    >
      <HudGrid />

      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <HudStatusBar />
      </motion.div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          <HudFrame>
            <ForgotPasswordForm />
          </HudFrame>
        </motion.div>
      </div>

      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        style={{ transform: 'translateZ(-30px)' }}
        className="pointer-events-none absolute inset-x-0 bottom-4 text-center font-mono text-[10px] uppercase tracking-[0.4em] text-muted"
      >
        J . A . R . V . I . S · Just A Rather Very Intelligent System
      </motion.div>
    </main>
  )
}
