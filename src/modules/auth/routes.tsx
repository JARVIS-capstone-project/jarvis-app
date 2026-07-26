import type { RouteObject } from 'react-router'
import { LoginPage } from '@modules/auth/ui/pages/login-page'
import { RegisterPage } from '@modules/auth/ui/pages/register-page'
import { ForgotPasswordPage } from '@modules/auth/ui/pages/forgot-password-page'
import { ForgotPasswordSentPage } from '@modules/auth/ui/pages/forgot-password-sent-page'
import { VerifyEmailPage } from '@modules/auth/ui/pages/verify-email-page'
import { VerifyEmailSentPage } from '@modules/auth/ui/pages/verify-email-sent-page'
import { ResetPasswordPage } from '@modules/auth/ui/pages/reset-password-page'
import { RedirectIfAuthed } from '@app/router/redirect-if-authed'

// Full-bleed HUD screens; mounted outside the app shell layout so the arc
// reactor rings can fill the viewport without a wrapping header.
// Every entry is wrapped in RedirectIfAuthed — an already-authed visitor
// hitting /login, /register, or /forgot-password gets bounced to /new
// BEFORE the framer-motion intro sequence paints.
export const authRoutes: RouteObject[] = [
  {
    path: 'login',
    element: (
      <RedirectIfAuthed to="/new">
        <LoginPage />
      </RedirectIfAuthed>
    ),
  },
  {
    path: 'register',
    element: (
      <RedirectIfAuthed to="/new">
        <RegisterPage />
      </RedirectIfAuthed>
    ),
  },
  {
    path: 'forgot-password',
    element: (
      <RedirectIfAuthed to="/new">
        <ForgotPasswordPage />
      </RedirectIfAuthed>
    ),
  },
  {
    path: 'forgot-password/sent',
    element: (
      <RedirectIfAuthed to="/new">
        <ForgotPasswordSentPage />
      </RedirectIfAuthed>
    ),
  },
  {
    // Landing target for the URL embedded in the verification email. Wrapped
    // in RedirectIfAuthed so an already-logged-in user hitting a stale link
    // gets bounced to /new rather than triggering a superfluous verify call.
    path: 'verify-email',
    element: (
      <RedirectIfAuthed to="/new">
        <VerifyEmailPage />
      </RedirectIfAuthed>
    ),
  },
  {
    // Post-register (and post-login-with-pending) "check your inbox" screen.
    path: 'verify-email/sent',
    element: (
      <RedirectIfAuthed to="/new">
        <VerifyEmailSentPage />
      </RedirectIfAuthed>
    ),
  },
  {
    // Landing target for the URL embedded in the password-reset email.
    // Wrapped in RedirectIfAuthed so an already-logged-in user hitting a
    // stale link bounces to /new rather than being asked to reset from
    // inside an authed session.
    path: 'reset-password',
    element: (
      <RedirectIfAuthed to="/new">
        <ResetPasswordPage />
      </RedirectIfAuthed>
    ),
  },
]
