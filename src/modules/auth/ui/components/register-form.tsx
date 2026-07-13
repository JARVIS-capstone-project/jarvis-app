import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { ArrowRight, KeyRound, Lock, Mail } from 'lucide-react'
import { BrandMark } from '@shared/ui/brand-mark'
import { Button } from '@shared/ui/button'
import { Input } from '@shared/ui/input'
import { useRegister } from '@modules/auth/model/use-register'

// Container drives the reveal: waits 0.4s after mount (letting the HUD +
// reactor settle first), then reveals each child 0.08s apart.
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
 * The register card. Owns field state + client-side gate (matching passwords
 * + terms); useRegister owns the submit lifecycle. On success the store is
 * already populated by the hook, so navigate to /new directly.
 *
 * Two error surfaces — merged into a single displayed message:
 *   - clientError: pre-submit gate failures (password mismatch, terms).
 *   - hook.error : post-submit BE failure (409 duplicate email, 400 validation).
 * Whichever is truthy wins; both clear when the user edits any field.
 */
export function RegisterForm() {
  const navigate = useNavigate()
  const { submit, isSubmitting, error: submitError, clearError: clearSubmitError } = useRegister()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [clientError, setClientError] = useState<string | null>(null)

  const error = clientError ?? submitError

  const clearError = () => {
    if (clientError) setClientError(null)
    clearSubmitError()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setClientError(null)
    if (password.length < 8) {
      setClientError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setClientError("Passwords don't match.")
      return
    }
    if (!acceptedTerms) {
      setClientError('You must accept the terms & conditions.')
      return
    }
    const session = await submit({ email, password })
    if (session) navigate('/new', { replace: true })
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
        <KeyRound className="size-3.5" aria-hidden="true" />
        <span>New · Registration</span>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-1 text-center">
        <h1 className="font-display text-3xl text-heading">Establish your identity.</h1>
        <p className="text-sm text-muted">Provision credentials to bring your workspace online.</p>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="alert"
          className="flex items-start gap-2 rounded-md border border-danger/40 bg-danger-soft px-3 py-2 text-xs text-danger"
        >
          <span className="mt-0.5 inline-block size-1.5 shrink-0 rounded-full bg-danger" />
          {error}
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="operator@stark.industries"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            clearError()
          }}
          leftIcon={<Mail className="size-4" />}
          required
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <Input
          id="register-password"
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            clearError()
          }}
          leftIcon={<Lock className="size-4" />}
          required
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value)
            clearError()
          }}
          leftIcon={<Lock className="size-4" />}
          required
        />
      </motion.div>

      <motion.label
        variants={itemVariants}
        className="flex cursor-pointer items-start gap-2 text-sm text-body select-none"
      >
        <input
          type="checkbox"
          checked={acceptedTerms}
          onChange={(e) => {
            setAcceptedTerms(e.target.checked)
            clearError()
          }}
          className="mt-0.5 size-4 shrink-0 cursor-pointer accent-brand"
        />
        <span>
          I agree to the{' '}
          <a
            href="#"
            className="text-brand transition-colors hover:text-brand-hover"
            onClick={(e) => e.preventDefault()}
          >
            Terms &amp; Conditions
          </a>
          .
        </span>
      </motion.label>

      <motion.div variants={itemVariants}>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          rightIcon={!isSubmitting ? <ArrowRight className="size-4" /> : undefined}
          className="w-full"
        >
          {isSubmitting ? 'Provisioning' : 'Establish identity'}
        </Button>
      </motion.div>

      <motion.p variants={itemVariants} className="text-center text-xs text-muted">
        Already have credentials?{' '}
        <Link to="/login" className="font-medium text-brand transition-colors hover:text-brand-hover">
          Log in
        </Link>
      </motion.p>
    </motion.form>
  )
}
