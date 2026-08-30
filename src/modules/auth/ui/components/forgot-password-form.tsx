import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { ArrowRight, Mail, MailQuestion } from 'lucide-react'
import { BrandMark } from '@shared/ui/brand-mark'
import { Button } from '@shared/ui/button'
import { Input } from '@shared/ui/input'
import { useRequestReset } from '@modules/auth/model/use-request-reset'

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
 * The /forgot-password card. Email input + submit → POST /auth/reset. The BE
 * responds identically for existing vs. missing emails on purpose
 * (enumeration-safe), so a successful navigation to /forgot-password/sent
 * is NEVER a confirmation that an email actually got dispatched.
 */
export function ForgotPasswordForm() {
  const navigate = useNavigate()
  const { status, errorMessage, request } = useRequestReset()
  const [email, setEmail] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const ok = await request(email)
    // On BE 2xx (which is 200 whether the account exists or not), forward
    // to the "check your inbox" screen and pass the email so it can be
    // echoed back for reassurance.
    if (ok) navigate('/forgot-password/sent', { replace: true, state: { email } })
  }

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
        <MailQuestion className="size-3.5" aria-hidden="true" />
        <span>Recovery · Reset</span>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-1 text-center">
        <h1 className="font-display text-3xl text-heading">Reset your credentials.</h1>
        <p className="text-sm text-muted">
          Enter the email you used to register and we'll send a link to reset your password.
        </p>
      </motion.div>

      {status === 'error' && errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
          className="flex items-start gap-2 rounded-md border border-danger/40 bg-danger-soft px-3 py-2 text-xs text-danger"
        >
          <span className="mt-0.5 inline-block size-1.5 shrink-0 rounded-full bg-danger" />
          {errorMessage}
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="operator@stark.industries"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="size-4" />}
          required
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={status === 'sending'}
          rightIcon={status === 'sending' ? undefined : <ArrowRight className="size-4" />}
          className="w-full"
        >
          {status === 'sending' ? 'Sending' : 'Send reset link'}
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
