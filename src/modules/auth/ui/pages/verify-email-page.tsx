import { Link, useSearchParams } from 'react-router'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  ShieldQuestion,
} from 'lucide-react'
import { HudGrid } from '@shared/ui/hud-grid'
import { HudFrame } from '@modules/auth/ui/components/hud-frame'
import { HudStatusBar } from '@modules/auth/ui/components/hud-status-bar'
import { BrandMark } from '@shared/ui/brand-mark'
import { Button } from '@shared/ui/button'
import { useVerifyEmail } from '@modules/auth/model/use-verify-email'

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
 * Landing page for the URL embedded in the verification email:
 * `/verify-email?token=<raw>`. Fires POST /auth/verify on mount, then
 * renders one of four states:
 *
 *   verifying → loading spinner
 *   success   → big "Access granted" card + Continue to login
 *   invalid   → "Link expired" card + resend affordance (→ /register)
 *   no-token  → "Missing token" — user hit the URL by hand
 *   error     → generic failure with retry
 *
 * Deliberately does NOT auto-log the user in — the plan-locked posture is
 * that verify only mutates status; login is a fresh act with fresh creds.
 */
export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const { status, errorMessage } = useVerifyEmail(token)

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

              {status === 'verifying' && <VerifyingPanel />}
              {status === 'success' && <SuccessPanel />}
              {status === 'invalid' && <InvalidPanel />}
              {status === 'no-token' && <NoTokenPanel />}
              {status === 'error' && <ErrorPanel message={errorMessage} />}
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

function StatusLabel({
  Icon,
  text,
  tone = 'brand',
}: {
  Icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  text: string
  tone?: 'brand' | 'danger' | 'muted'
}) {
  const color =
    tone === 'danger' ? 'text-danger' : tone === 'muted' ? 'text-muted' : 'text-brand'
  return (
    <motion.div
      variants={itemVariants}
      className={`flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] ${color}`}
    >
      <Icon className="size-3.5" aria-hidden />
      <span>{text}</span>
    </motion.div>
  )
}

function VerifyingPanel() {
  return (
    <>
      <StatusLabel Icon={Loader2} text="Verifying · Handshake" />
      <motion.div variants={itemVariants} className="flex justify-center pt-2">
        <Loader2 className="size-8 animate-spin text-brand" aria-hidden />
      </motion.div>
      <motion.div variants={itemVariants} className="space-y-2 text-center">
        <h1 className="font-display text-2xl text-heading">Verifying your email…</h1>
        <p className="text-sm text-muted">Contacting mission control. This should take a second.</p>
      </motion.div>
    </>
  )
}

function SuccessPanel() {
  return (
    <>
      <StatusLabel Icon={ShieldCheck} text="Access · Granted" />
      <motion.div variants={itemVariants} className="flex justify-center pt-2">
        <CheckCircle2 className="size-10 text-brand drop-shadow-[0_0_16px_var(--brand-glow-strong)]" aria-hidden />
      </motion.div>
      <motion.div variants={itemVariants} className="space-y-2 text-center">
        <h1 className="font-display text-3xl text-heading">Email verified.</h1>
        <p className="text-sm text-muted">
          Your account is now active. Log in to bring your workspace online.
        </p>
      </motion.div>
      <motion.div variants={itemVariants}>
        <Link to="/login">
          <Button
            type="button"
            variant="primary"
            size="lg"
            rightIcon={<ArrowRight className="size-4" />}
            className="w-full"
            autoFocus
          >
            Continue to login
          </Button>
        </Link>
      </motion.div>
    </>
  )
}

function InvalidPanel() {
  return (
    <>
      <StatusLabel Icon={AlertTriangle} text="Link · Expired" tone="danger" />
      <motion.div variants={itemVariants} className="space-y-2 text-center">
        <h1 className="font-display text-2xl text-heading">This link is no longer valid.</h1>
        <p className="text-sm text-muted">
          Verification links expire after 10 minutes and can only be used once. Register again to
          receive a fresh one, or log in if you already verified.
        </p>
      </motion.div>
      <motion.div variants={itemVariants} className="flex flex-col gap-2 sm:flex-row">
        <Link to="/register" className="flex-1">
          <Button type="button" variant="secondary" size="lg" className="w-full">
            Get a new link
          </Button>
        </Link>
        <Link to="/login" className="flex-1">
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
    </>
  )
}

function NoTokenPanel() {
  return (
    <>
      <StatusLabel Icon={ShieldQuestion} text="Missing · Token" tone="muted" />
      <motion.div variants={itemVariants} className="space-y-2 text-center">
        <h1 className="font-display text-2xl text-heading">No verification token.</h1>
        <p className="text-sm text-muted">
          Open the link from the verification email we sent you. If you can't find it, register again
          to trigger a new one.
        </p>
      </motion.div>
      <motion.div variants={itemVariants}>
        <Link to="/register">
          <Button
            type="button"
            variant="primary"
            size="lg"
            rightIcon={<ArrowRight className="size-4" />}
            className="w-full"
          >
            Back to register
          </Button>
        </Link>
      </motion.div>
    </>
  )
}

function ErrorPanel({ message }: { message: string | null }) {
  return (
    <>
      <StatusLabel Icon={AlertTriangle} text="Verify · Error" tone="danger" />
      <motion.div variants={itemVariants} className="space-y-2 text-center">
        <h1 className="font-display text-2xl text-heading">Something went wrong.</h1>
        <p className="text-sm text-muted">
          We couldn't verify your email right now. Please try the link again in a moment.
        </p>
        {message && (
          <p className="pt-2 font-mono text-[11px] text-muted">{message}</p>
        )}
      </motion.div>
      <motion.div variants={itemVariants}>
        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={() => window.location.reload()}
          className="w-full"
        >
          Try again
        </Button>
      </motion.div>
    </>
  )
}
