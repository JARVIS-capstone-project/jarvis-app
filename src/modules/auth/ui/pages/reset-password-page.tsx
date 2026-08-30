import { Link, useSearchParams } from 'react-router'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { ArrowRight, ShieldQuestion } from 'lucide-react'
import { HudGrid } from '@shared/ui/hud-grid'
import { HudFrame } from '@modules/auth/ui/components/hud-frame'
import { HudStatusBar } from '@modules/auth/ui/components/hud-status-bar'
import { BrandMark } from '@shared/ui/brand-mark'
import { Button } from '@shared/ui/button'
import { ResetPasswordForm } from '@modules/auth/ui/components/reset-password-form'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.4 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

/**
 * Landing page for the URL embedded in the password-reset email:
 * `/reset-password?token=<raw>`. Renders one of two things based on the URL:
 *
 *   token present → <ResetPasswordForm> (the form owns the confirm/success/
 *                    invalid/error state machine internally)
 *   token missing → <NoTokenPanel> — user hit the URL by hand
 *
 * The already-authed short-circuit lives at the route level via
 * <RedirectIfAuthed> in [routes.tsx](../../routes.tsx) — a logged-in user
 * hitting a stale link bounces to /new before this component renders.
 */
export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  return (
    <main
      style={{ perspective: '1600px', transformStyle: 'preserve-3d' }}
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
            {token ? <ResetPasswordForm token={token} /> : <NoTokenPanel />}
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

function NoTokenPanel() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      style={{
        boxShadow:
          '0 30px 60px -20px rgba(0,0,0,0.35), 0 0 80px var(--brand-glow-soft), inset 0 1px 0 rgba(255,255,255,0.08)',
      }}
      className="relative w-full space-y-5 rounded-2xl border border-brand/30 bg-panel/85 p-8 backdrop-blur-xl"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-6 top-0 h-px"
        style={{
          background: 'linear-gradient(to right, transparent, var(--brand-hover), transparent)',
        }}
      />
      <motion.div variants={itemVariants} className="flex justify-center">
        <BrandMark className="h-12 drop-shadow-[0_0_20px_var(--brand-glow-strong)]" />
      </motion.div>
      <motion.div
        variants={itemVariants}
        className="flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-muted"
      >
        <ShieldQuestion className="size-3.5" aria-hidden />
        <span>Missing · Token</span>
      </motion.div>
      <motion.div variants={itemVariants} className="space-y-2 text-center">
        <h1 className="font-display text-2xl text-heading">No reset token.</h1>
        <p className="text-sm text-muted">
          Open the link from the reset email we sent you. If you can't find it, request a new one.
        </p>
      </motion.div>
      <motion.div variants={itemVariants}>
        <Link to="/forgot-password">
          <Button
            type="button"
            variant="primary"
            size="lg"
            rightIcon={<ArrowRight className="size-4" />}
            className="w-full"
          >
            Request a new link
          </Button>
        </Link>
      </motion.div>
    </motion.div>
  )
}
