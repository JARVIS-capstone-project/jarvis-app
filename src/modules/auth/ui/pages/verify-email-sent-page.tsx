import { Link, useLocation } from 'react-router'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { ArrowRight, CheckCircle2, MailCheck, RotateCw } from 'lucide-react'
import { HudGrid } from '@shared/ui/hud-grid'
import { HudFrame } from '@modules/auth/ui/components/hud-frame'
import { HudStatusBar } from '@modules/auth/ui/components/hud-status-bar'
import { BrandMark } from '@shared/ui/brand-mark'
import { Button } from '@shared/ui/button'
import { useResendVerification } from '@modules/auth/model/use-resend-verification'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.4 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
}

/**
 * Post-register confirmation screen — also reused when login lands on a
 * pending account and gets redirected here. Copy stays enumeration-safe:
 * the email is only shown when the caller navigated here with it in
 * router state; direct URL visits show the generic copy so this URL can't
 * be used to phish an email out of anyone.
 *
 * The Resend button hits POST /auth/verify/resend, which always returns 200 —
 * clicking it is safe whether the account exists, is already verified, or is
 * throttled. Success just swaps the button label to a "sent" confirmation.
 */
export function VerifyEmailSentPage() {
  const location = useLocation()
  const email = (location.state as { email?: string } | null)?.email
  const { status, errorMessage, resend } = useResendVerification()

  const canResend = Boolean(email) && (status === 'idle' || status === 'error')
  const resendLabel =
    status === 'sending'
      ? 'Sending…'
      : status === 'sent'
        ? 'Sent — check your inbox again'
        : 'Resend verification email'

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
                  background:
                    'linear-gradient(to right, transparent, var(--brand-hover), transparent)',
                }}
              />

              <motion.div variants={itemVariants} className="flex justify-center">
                <BrandMark className="h-12 drop-shadow-[0_0_20px_var(--brand-glow-strong)]" />
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-brand"
              >
                <MailCheck className="size-3.5" aria-hidden="true" />
                <span>Verification · Pending</span>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2 text-center">
                <h1 className="font-display text-3xl text-heading">Check your inbox.</h1>
                <p className="text-sm text-muted">
                  We sent a verification link
                  {email ? (
                    <>
                      {' '}
                      to <span className="text-heading">{email}</span>
                    </>
                  ) : null}
                  . Click it to activate your account. The link expires in 10 minutes.
                </p>
              </motion.div>

              {status === 'sent' && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="status"
                  className="flex items-start gap-2 rounded-md border border-brand/40 bg-brand/10 px-3 py-2 text-xs text-brand"
                >
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>
                    If your account still needs verification, a new link has been sent. Check your inbox
                    (and spam).
                  </span>
                </motion.div>
              )}

              {status === 'error' && errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="alert"
                  className="flex items-start gap-2 rounded-md border border-danger/40 bg-danger-soft px-3 py-2 text-xs text-danger"
                >
                  <span className="mt-0.5 inline-block size-1.5 shrink-0 rounded-full bg-danger" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}

              <motion.div
                variants={itemVariants}
                className="rounded-md border border-divider bg-canvas/40 p-3 text-xs text-body"
              >
                Didn't see it? Check spam
                {email ? (
                  <>
                    {', or '}
                    <button
                      type="button"
                      onClick={() => void resend(email)}
                      disabled={!canResend}
                      className="font-medium text-brand transition-colors hover:text-brand-hover disabled:cursor-not-allowed disabled:text-muted"
                    >
                      resend the email
                    </button>
                    .
                  </>
                ) : (
                  <>
                    {', then '}
                    <Link
                      to="/register"
                      className="font-medium text-brand transition-colors hover:text-brand-hover"
                    >
                      try again
                    </Link>
                    .
                  </>
                )}
              </motion.div>

              {email && (
                <motion.div variants={itemVariants}>
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    onClick={() => void resend(email)}
                    disabled={!canResend}
                    isLoading={status === 'sending'}
                    leftIcon={
                      status === 'sending' ? undefined : (
                        <RotateCw className="size-4" aria-hidden="true" />
                      )
                    }
                    className="w-full"
                  >
                    {resendLabel}
                  </Button>
                </motion.div>
              )}

              <motion.div variants={itemVariants}>
                <Link to="/login">
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    rightIcon={<ArrowRight className="size-4" />}
                    className="w-full"
                  >
                    Continue to login
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
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
