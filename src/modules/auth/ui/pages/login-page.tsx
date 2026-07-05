import { motion } from "framer-motion";
import { HudGrid } from "@shared/ui/hud-grid";
import { HudFrame } from "@modules/auth/ui/components/hud-frame";
import { HudStatusBar } from "@modules/auth/ui/components/hud-status-bar";
import { LoginForm } from "@modules/auth/ui/components/login-form";

/**
 * The /login screen. Centered single-column layout.
 *
 * Mount choreography (framer-motion), fires the moment the route resolves:
 *   t=0.00s  HUD status bar slides down from the top
 *   t=0.30s  Login card fades + slides up from below
 *   t=0.40s  Form children stagger-reveal (see login-form.tsx)
 *   t=1.20s  Bottom watermark fades in last
 *
 * Looping animations (spin, pulse, scanline) stay in CSS — they don't need
 * motion's lifecycle awareness and would be more expensive on the framework.
 */
export function LoginPage() {
  return (
    <main
      style={{
        perspective: "1600px",
        transformStyle: "preserve-3d",
      }}
      className="relative min-h-screen overflow-hidden bg-canvas"
    >
      <HudGrid />

      {/* Status bar — slides down from above the viewport edge. */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <HudStatusBar />
      </motion.div>

      {/* Centered form container. Card slides up from below the fold as
          it fades in — motion.form inside handles child staggering. */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          <HudFrame>
            <LoginForm />
          </HudFrame>
        </motion.div>
      </div>

      {/* Bottom watermark — arrives last so it feels like the boot sequence
          completing. Recessed with translateZ so it feels part of the scene. */}
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        style={{ transform: "translateZ(-30px)" }}
        className="pointer-events-none absolute inset-x-0 bottom-4 text-center font-mono text-[10px] uppercase tracking-[0.4em] text-muted"
      >
        J . A . R . V . I . S · Just A Rather Very Intelligent System
      </motion.div>
    </main>
  );
}
