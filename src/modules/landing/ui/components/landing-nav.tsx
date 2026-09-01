import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, ChevronDown, LayoutDashboard, LogOut, Menu, Moon, Sun, User, X } from 'lucide-react'
import { BrandMark } from '@shared/ui/brand-mark'
import { useTheme } from '@app/providers/theme-context'
import { env } from '@shared/config/env'
import { useAuthStore, useIsAuthenticated } from '@modules/auth/model/auth-store'
import { useLogout } from '@modules/auth/model/use-logout'
import { decodeAccessToken } from '@shared/lib/decode-jwt'

interface NavLinkItem {
  label: string
  href: string
}

const NAV_LINKS: NavLinkItem[] = [
  { label: 'Capabilities', href: '#capabilities' },
  { label: 'Protocol', href: '#protocol' },
  ...(env.isDev ? [{ label: 'Dev', href: '/dev' }] : []),
]

/**
 * Nav link swatch — swaps text color to match the outer nav state. Passing
 * `scrolled` (really "morphed") keeps every link in sync with the container.
 */
function NavLink({
  scrolled,
  href,
  children,
  onClick,
}: {
  scrolled: boolean
  href: string
  children: ReactNode
  onClick?: () => void
}) {
  const cls =
    'font-mono text-[11px] uppercase tracking-[0.3em] transition-colors duration-300 hover:text-brand ' +
    (scrolled ? 'text-body' : 'text-heading')
  return href.startsWith('/') ? (
    <Link to={href} onClick={onClick} className={cls}>
      {children}
    </Link>
  ) : (
    <a href={href} onClick={onClick} className={cls}>
      {children}
    </a>
  )
}

/**
 * Signed-in user pill on the landing nav.
 *
 * Reads email from the persisted JWT (never fires `/auth/me` — the landing
 * page is public and we don't want a token-invalid response to redirect a
 * visitor away from the marketing page). Dropdown: Dashboard, Logout.
 *
 * Closes on: outside click, Escape, item click.
 */
function UserMenu({ scrolled }: { scrolled: boolean }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const accessToken = useAuthStore((s) => s.accessToken)
  const { logout } = useLogout()
  const email = accessToken ? (decodeAccessToken(accessToken)?.email ?? null) : null
  const label = email ?? 'Signed in'

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const trigger =
    'group inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.3em] transition-all duration-300 cursor-pointer ' +
    (scrolled
      ? 'border border-divider bg-surface/60 text-heading hover:border-brand/50 hover:text-brand'
      : 'border border-brand/50 bg-brand/5 text-heading backdrop-blur-md hover:bg-brand/10 hover:border-brand')

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={trigger}
      >
        <span
          aria-hidden="true"
          className="grid size-6 place-items-center rounded-full bg-brand text-[10px] font-semibold text-white shadow-[0_0_12px_var(--brand-shadow)]"
        >
          <User className="size-3" />
        </span>
        <span className="max-w-[140px] truncate normal-case tracking-normal">{label}</span>
        <ChevronDown
          className={'size-3 transition-transform ' + (open ? 'rotate-180' : '')}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-divider bg-surface/95 shadow-[0_16px_40px_var(--brand-shadow)] backdrop-blur-xl"
          >
            {email && (
              <div className="border-b border-divider px-4 py-3 text-[11px]">
                <p className="truncate font-mono uppercase tracking-[0.2em] text-muted">Signed in as</p>
                <p className="mt-1 truncate text-body">{email}</p>
              </div>
            )}
            <Link
              to="/new"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.3em] text-body transition-colors hover:bg-brand/10 hover:text-brand"
            >
              <LayoutDashboard className="size-4" aria-hidden="true" />
              Dashboard
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                void logout()
              }}
              className="flex w-full items-center gap-3 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.3em] text-body transition-colors hover:bg-brand/10 hover:text-brand cursor-pointer"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Fixed morphing top nav.
 *
 *   - Top of page       — full-bleed, transparent
 *   - Scrolled or menu  — 90% width pill (max 1000px), glass
 *
 * Container morph is pure Tailwind + CSS transition-all on a single className
 * ternary. Child colors get their own 300ms transitions. The mobile drawer
 * uses framer-motion `AnimatePresence` for the height open/close.
 *
 * Theme-adaptive: both the pill and the ambient text use semantic tokens
 * (`bg-surface`, `border-divider`, `text-heading`, `text-body`) so the nav
 * flips with the app-wide `.dark` class — dark pill + light text on dark,
 * cream pill + dark text on light.
 */
export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { theme, toggle } = useTheme()
  const isAuthed = useIsAuthenticated()
  const { logout } = useLogout()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const morphed = scrolled || menuOpen
  const ThemeIcon = theme === 'dark' ? Sun : Moon

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex flex-col items-center">
      <nav
        className={
          'flex items-center transition-all duration-500 ' +
          (morphed
            ? 'mt-3 w-[90%] max-w-[1000px] rounded-[24px] border border-divider bg-surface/80 px-4 py-2 shadow-[0_16px_40px_var(--brand-shadow)] backdrop-blur-xl'
            : 'mt-0 w-full max-w-none rounded-none border border-transparent bg-transparent px-8 py-5 shadow-none backdrop-blur-0')
        }
      >
        {/* Logo — the JARVIS mark + wordmark; the mark's baked-in orange reads
            on both cream and dark heroes, no theme-adaptation needed. */}
        <Link
          to="/"
          className="group flex items-center gap-2 font-mono text-xs uppercase tracking-[0.35em] transition-all duration-500"
        >
          <BrandMark className="h-8 drop-shadow-[0_0_12px_var(--brand-glow-strong)]" />
          <span className="text-heading">J.A.R.V.I.S</span>
        </Link>

        {/* Desktop links + theme toggle + primary CTA */}
        <div className="ml-auto hidden items-center gap-6 md:flex">
          <div className="flex items-center gap-6">
            {NAV_LINKS.map((l) => (
              <NavLink key={l.href} scrolled={morphed} href={l.href}>
                {l.label}
              </NavLink>
            ))}
          </div>

          <button
            type="button"
            onClick={toggle}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className={
              'grid size-9 place-items-center rounded-full transition-colors duration-300 cursor-pointer ' +
              (morphed
                ? 'text-heading hover:bg-brand/10 hover:text-brand'
                : 'text-heading hover:bg-hover hover:text-brand')
            }
          >
            <ThemeIcon className="size-4" aria-hidden="true" />
          </button>

          {isAuthed ? (
            <UserMenu scrolled={morphed} />
          ) : (
            <Link
              to="/login"
              className={
                'group inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.3em] transition-all duration-300 cursor-pointer ' +
                (morphed
                  ? 'bg-brand text-white shadow-[0_0_20px_var(--brand-shadow)] hover:bg-brand-hover'
                  : 'border border-brand/50 bg-brand/5 text-brand backdrop-blur-md hover:bg-brand/10 hover:border-brand')
              }
            >
              Access
              <ArrowRight
                className="size-3 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          className={
            'ml-auto grid size-10 place-items-center rounded-full transition-colors duration-300 cursor-pointer md:hidden ' +
            (morphed
              ? 'text-heading hover:bg-brand/10'
              : 'text-heading hover:bg-hover')
          }
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {/* Mobile drawer — framer-motion drives the height animation. */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="drawer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="mt-2 w-[90%] max-w-[1000px] overflow-hidden rounded-[24px] border border-divider bg-surface/90 shadow-[0_16px_40px_var(--brand-shadow)] backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col gap-1 p-4">
              {NAV_LINKS.map((l) => (
                <NavLink
                  key={l.href}
                  scrolled={true}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="block rounded-lg px-3 py-3 hover:bg-brand/10 hover:text-brand">
                    {l.label}
                  </span>
                </NavLink>
              ))}
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggle}
                  aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                  className="grid size-11 place-items-center rounded-full border border-divider text-heading transition-colors hover:bg-brand/10 hover:text-brand cursor-pointer"
                >
                  <ThemeIcon className="size-4" aria-hidden="true" />
                </button>
                {isAuthed ? (
                  <>
                    <Link
                      to="/new"
                      onClick={() => setMenuOpen(false)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-brand px-4 py-3 font-mono text-[11px] uppercase tracking-[0.3em] text-white shadow-[0_0_20px_var(--brand-shadow)] transition-colors hover:bg-brand-hover cursor-pointer"
                    >
                      <LayoutDashboard className="size-3.5" aria-hidden="true" />
                      Dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false)
                        void logout()
                      }}
                      aria-label="Logout"
                      className="grid size-11 place-items-center rounded-full border border-divider text-heading transition-colors hover:bg-brand/10 hover:text-brand cursor-pointer"
                    >
                      <LogOut className="size-4" aria-hidden="true" />
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-brand px-4 py-3 font-mono text-[11px] uppercase tracking-[0.3em] text-white shadow-[0_0_20px_var(--brand-shadow)] transition-colors hover:bg-brand-hover cursor-pointer"
                  >
                    Access
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
