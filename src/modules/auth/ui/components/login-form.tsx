import { useState } from 'react'
import type { FormEvent } from 'react'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { ArrowRight, Fingerprint, Lock, Mail } from 'lucide-react'
import { BrandMark } from '@shared/ui/brand-mark'
import { Button } from '@shared/ui/button'
import { Input } from '@shared/ui/input'
import { useLogin } from '@modules/auth/model/use-login'

// Container drives the reveal: waits 0.4s after mount (letting the HUD + reactor
// settle first), then reveals each child 0.08s apart. Total sequence ~1.2s.
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.4 },
  },
}

// Each item slides up 12px while fading. easeOutExpo-ish curve for a confident
// arrival — no lazy easing that reads as sluggish.
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
}

/**
 * The login card. Owns field state so the hook can stay focused on the async
 * submit lifecycle. Uses the shared Input (which already handles password
 * reveal) and Button primitives so styling stays token-driven.
 */
export function LoginForm() {
  const { submit, isSubmitting, error, clearError } = useLogin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await submit({ email, password, remember })
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      variants={containerVariants}
      initial="hidden"
      animate="show"
      style={{
        // Layered shadows fake a hovering glass panel: sharp near-shadow for
        // lift, orange bloom for the reactor spill, inset highlight for the
        // top edge catching ambient light.
        boxShadow:
          '0 30px 60px -20px rgba(0,0,0,0.35), 0 0 80px var(--brand-glow-soft), inset 0 1px 0 rgba(255,255,255,0.08)',
      }}
      className="relative w-full space-y-5 rounded-2xl border border-brand/30 bg-panel/85 p-8 backdrop-blur-xl"
    >
      {/* Top specular sheen — a thin gradient along the upper edge that mimics
          light glinting off a beveled glass top. Purely decorative. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-6 top-0 h-px"
        style={{
          background:
            'linear-gradient(to right, transparent, var(--brand-hover), transparent)',
        }}
      />

      {/* Brand mark — anchors the card and reinforces the JARVIS lockup. */}
      <motion.div variants={itemVariants} className="flex justify-center">
        <BrandMark className="h-12 drop-shadow-[0_0_20px_var(--brand-glow-strong)]" />
      </motion.div>

      {/* Eyebrow — mirrors the landing page's small-caps brand mark. */}
      <motion.div
        variants={itemVariants}
        className="flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-brand"
      >
        <Fingerprint className="size-3.5" aria-hidden="true" />
        <span>Identity · Verification</span>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-1 text-center">
        <h1 className="font-display text-3xl text-heading">Welcome back, Operator.</h1>
        <p className="text-sm text-muted">Authenticate to bring your workspace online.</p>
      </motion.div>

      {/* Global error surface — sits above fields so it's the first thing read.
          Not staggered: mounts/unmounts with its own quick fade so state changes
          don't wait on the intro sequence. */}
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

      <motion.div variants={itemVariants} className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="login-password" className="text-sm font-medium text-heading">
            Password
          </label>
          <button
            type="button"
            className="cursor-pointer text-xs text-brand transition-colors hover:text-brand-hover"
          >
            Forgot?
          </button>
        </div>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••••"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            clearError()
          }}
          leftIcon={<Lock className="size-4" />}
          required
        />
      </motion.div>

      <motion.label
        variants={itemVariants}
        className="flex cursor-pointer items-center gap-2 text-sm text-body select-none"
      >
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className="size-4 cursor-pointer accent-brand"
        />
        Keep this session online for 30 days
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
          {isSubmitting ? 'Authenticating' : 'Engage'}
        </Button>
      </motion.div>

      <motion.p variants={itemVariants} className="text-center text-xs text-muted">
        No credentials on file?{' '}
        <button
          type="button"
          className="cursor-pointer font-medium text-brand transition-colors hover:text-brand-hover"
        >
          Request access
        </button>
      </motion.p>
    </motion.form>
  )
}
