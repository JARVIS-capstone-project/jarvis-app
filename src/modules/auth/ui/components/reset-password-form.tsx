import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Lock,
  ShieldCheck,
} from 'lucide-react'
import { BrandMark } from '@shared/ui/brand-mark'
import { Button } from '@shared/ui/button'
import { Input } from '@shared/ui/input'
import { useConfirmReset } from '@modules/auth/model/use-confirm-reset'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.4 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

const MIN_PASSWORD_LENGTH = 8

/**
 * Reset-password card. Renders one of four visuals based on the confirm-flow
 * status:
 *   idle/submitting → the form itself (two password inputs)
 *   success         → "Password updated" + Continue to login
 *   invalid         → "Link expired" + Request a new link
 *   error           → generic failure + Try again
 *
 * FE validation is minimal by design: both fields must be ≥ MIN_PASSWORD_LENGTH
 * AND match. Matching the BE (@Size(min=8) on newPassword) means the BE
 * shouldn't ever 400 on password length in practice — if it does, the error
 * lands in the generic ErrorPanel (which is correct: it's not a token issue).
 */
export function ResetPasswordForm({ token }: { token: string }) {
  const { status, errorMessage, confirm, reset } = useConfirmReset()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLocalError(null)
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setLocalError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    if (newPassword !== confirmPassword) {
      setLocalError('Passwords do not match.')
      return
    }
    await confirm(token, newPassword)
  }

  if (status === 'success') return <SuccessPanel />
  if (status === 'invalid') return <InvalidPanel />
  if (status === 'error') return <ErrorPanel message={errorMessage} onRetry={reset} />

  return (
    <motion.form
      onSubmit={handleSubmit}
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
        className="flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-brand"
      >
        <KeyRound className="size-3.5" aria-hidden="true" />
        <span>Recovery · Reset</span>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-1 text-center">
        <h1 className="font-display text-3xl text-heading">Set a new password.</h1>
        <p className="text-sm text-muted">
          Choose a new password for your account. It must be at least {MIN_PASSWORD_LENGTH}{' '}
          characters.
        </p>
      </motion.div>

      {localError && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
          className="flex items-start gap-2 rounded-md border border-danger/40 bg-danger-soft px-3 py-2 text-xs text-danger"
        >
          <span className="mt-0.5 inline-block size-1.5 shrink-0 rounded-full bg-danger" />
          {localError}
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••••"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value)
            if (localError) setLocalError(null)
          }}
          leftIcon={<Lock className="size-4" />}
          required
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••••"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value)
            if (localError) setLocalError(null)
          }}
          leftIcon={<Lock className="size-4" />}
          required
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={status === 'submitting'}
          rightIcon={status === 'submitting' ? undefined : <ArrowRight className="size-4" />}
          className="w-full"
        >
          {status === 'submitting' ? 'Updating' : 'Update password'}
        </Button>
      </motion.div>

      <motion.p variants={itemVariants} className="text-center text-xs text-muted">
        Remembered it?{' '}
        <Link to="/login" className="font-medium text-brand transition-colors hover:text-brand-hover">
          Log in
        </Link>
      </motion.p>
    </motion.form>
  )
}

/** Post-success panel. Shape mirrors verify-email's SuccessPanel. */
function SuccessPanel() {
  return (
    <PanelShell>
      <StatusLabel Icon={ShieldCheck} text="Password · Updated" />
      <motion.div variants={itemVariants} className="flex justify-center pt-2">
        <CheckCircle2
          className="size-10 text-brand drop-shadow-[0_0_16px_var(--brand-glow-strong)]"
          aria-hidden
        />
      </motion.div>
      <motion.div variants={itemVariants} className="space-y-2 text-center">
        <h1 className="font-display text-3xl text-heading">Password updated.</h1>
        <p className="text-sm text-muted">
          Your new password is active. Log in to bring your workspace online.
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
    </PanelShell>
  )
}

/** Expired / already-used / bad token panel. */
function InvalidPanel() {
  return (
    <PanelShell>
      <StatusLabel Icon={AlertTriangle} text="Link · Expired" tone="danger" />
      <motion.div variants={itemVariants} className="space-y-2 text-center">
        <h1 className="font-display text-2xl text-heading">This link is no longer valid.</h1>
        <p className="text-sm text-muted">
          Reset links expire after an hour and can only be used once. Request a fresh one to
          continue.
        </p>
      </motion.div>
      <motion.div variants={itemVariants} className="flex flex-col gap-2 sm:flex-row">
        <Link to="/forgot-password" className="flex-1">
          <Button type="button" variant="secondary" size="lg" className="w-full">
            Request a new link
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
    </PanelShell>
  )
}

/** Generic failure — network, 5xx, unexpected. */
function ErrorPanel({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <PanelShell>
      <StatusLabel Icon={AlertTriangle} text="Reset · Error" tone="danger" />
      <motion.div variants={itemVariants} className="space-y-2 text-center">
        <h1 className="font-display text-2xl text-heading">Something went wrong.</h1>
        <p className="text-sm text-muted">
          We couldn't update your password right now. Please try again in a moment.
        </p>
        {message && <p className="pt-2 font-mono text-[11px] text-muted">{message}</p>}
      </motion.div>
      <motion.div variants={itemVariants}>
        <Button type="button" variant="primary" size="lg" onClick={onRetry} className="w-full">
          Try again
        </Button>
      </motion.div>
    </PanelShell>
  )
}

/** Shared chrome for the three post-submit panels (success/invalid/error). */
function PanelShell({ children }: { children: React.ReactNode }) {
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
      {children}
    </motion.div>
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
