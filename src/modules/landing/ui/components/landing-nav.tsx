import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Menu, Moon, Sun, X } from 'lucide-react'
import { BrandMark } from '@shared/ui/brand-mark'
import { useTheme } from '@app/providers/theme-context'

interface NavLinkItem {
  label: string
  href: string
}

const NAV_LINKS: NavLinkItem[] = [
  { label: 'Capabilities', href: '#capabilities' },
  { label: 'Protocol', href: '#protocol' },
  { label: 'Dev', href: '/dev' },
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
 * Fixed morphing top nav.
 *
 *   - Top of page       — full-bleed, transparent, white text (dark hero)
 *   - Scrolled or menu  — 90% width pill (max 1000px), glass, dark text
 *
 * Container morph is pure Tailwind + CSS transition-all on a single className
 * ternary. Child colors get their own 300ms transitions. The mobile drawer
 * uses framer-motion `AnimatePresence` for the height open/close.
 *
 * The morphed pill wears the `.light` class so JARVIS tokens (--heading,
 * --body, --brand) resolve to their light-mode values regardless of the
 * app-wide theme — keeps the glass pill legible in dark mode too.
 */
export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { theme, toggle } = useTheme()

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
            ? 'light mt-3 w-[90%] max-w-[1000px] rounded-[24px] border border-white/60 bg-white/80 px-4 py-2 shadow-[0_16px_40px_var(--brand-shadow)] backdrop-blur-xl'
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
            className="light mt-2 w-[90%] max-w-[1000px] overflow-hidden rounded-[24px] border border-white/60 bg-white/90 shadow-[0_16px_40px_var(--brand-shadow)] backdrop-blur-xl md:hidden"
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
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-brand px-4 py-3 font-mono text-[11px] uppercase tracking-[0.3em] text-white shadow-[0_0_20px_var(--brand-shadow)] transition-colors hover:bg-brand-hover cursor-pointer"
                >
                  Access
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
