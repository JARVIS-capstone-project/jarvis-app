import { useEffect, useRef, useState } from 'react'
import type { SettingsSection } from '@app/layout/settings-modal'
import { useTheme } from '@app/providers/theme-context'
import type { Theme } from '@app/providers/theme-context'
import { BrandMark } from '@shared/ui/brand-mark'
import { cn } from '@shared/lib/cn'

interface SettingsGeneralTabProps {
  initialSection?: SettingsSection
}

const SKELETON_MS = 800

/**
 * Content of the General tab inside the settings modal. Two sections:
 *   1. Profile — placeholder for now, briefly shows a skeleton on mount
 *      (0.8s) to convey "loading" before the empty state settles.
 *   2. Theme — two mockup preview cards; clicking one applies the theme
 *      via ThemeProvider. Modal stays open (unlike the earlier standalone
 *      picker) so the user can compare / keep exploring.
 *
 * `initialSection === 'theme'` scrolls the theme section into view on
 * mount — used when the sidebar popover's Theme item opens the modal.
 */
export function SettingsGeneralTab({ initialSection }: SettingsGeneralTabProps) {
  const [showSkeleton, setShowSkeleton] = useState(true)
  const themeSectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setShowSkeleton(false), SKELETON_MS)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (initialSection === 'theme' && themeSectionRef.current) {
      themeSectionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }, [initialSection])

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h3 className="mb-4 text-lg font-semibold text-heading">Profile</h3>
        {showSkeleton ? <ProfileSkeleton /> : <ProfilePlaceholder />}
      </section>

      <section ref={themeSectionRef}>
        <h3 className="mb-4 text-lg font-semibold text-heading">Theme</h3>
        <ThemePicker />
      </section>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="h-4 w-24 animate-pulse rounded bg-surface" />
      <div className="h-10 w-full animate-pulse rounded bg-surface" />
      <div className="h-4 w-28 animate-pulse rounded bg-surface" />
      <div className="h-10 w-full animate-pulse rounded bg-surface" />
    </div>
  )
}

function ProfilePlaceholder() {
  return (
    <div className="flex flex-col gap-4">
      <ProfileRow label="Full name" value="—" />
      <ProfileRow label="Display name" value="—" />
      <p className="text-xs italic text-muted">Profile editing coming soon.</p>
    </div>
  )
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-divider pb-3">
      <span className="text-sm text-body">{label}</span>
      <span className="text-sm text-muted">{value}</span>
    </div>
  )
}

function ThemePicker() {
  const { theme, setTheme } = useTheme()
  return (
    <div className="grid grid-cols-2 gap-4">
      <ThemePreviewCard
        variant="light"
        isActive={theme === 'light'}
        onSelect={() => setTheme('light')}
      />
      <ThemePreviewCard
        variant="dark"
        isActive={theme === 'dark'}
        onSelect={() => setTheme('dark')}
      />
    </div>
  )
}

interface ThemePreviewCardProps {
  variant: Theme
  isActive: boolean
  onSelect: () => void
}

// Fixed palettes per variant so each card renders in its target theme
// regardless of the app's current theme. Kept small and deliberate — this
// is a preview surface, not a real theme system.
const PALETTE = {
  light: {
    bg: 'bg-white',
    rail: 'bg-slate-100',
    text: 'text-slate-900',
    line: 'bg-slate-200',
    dotIdle: 'border-slate-300',
    border: 'border-slate-200',
  },
  dark: {
    bg: 'bg-slate-950',
    rail: 'bg-slate-900',
    text: 'text-slate-100',
    line: 'bg-slate-800',
    dotIdle: 'border-slate-700',
    border: 'border-slate-800',
  },
} as const

function ThemePreviewCard({
  variant,
  isActive,
  onSelect,
}: ThemePreviewCardProps) {
  const p = PALETTE[variant]
  const label = variant === 'dark' ? 'Dark' : 'Light'

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex flex-col overflow-hidden rounded-xl border transition-all',
        p.border,
        p.bg,
        isActive
          ? 'ring-2 ring-brand ring-offset-2 ring-offset-panel'
          : 'hover:ring-2 hover:ring-divider hover:ring-offset-2 hover:ring-offset-panel',
      )}
    >
      <div className={cn('flex h-32 gap-1 p-2', p.bg)}>
        <div className={cn('flex w-1/3 flex-col gap-1.5 rounded-md p-2', p.rail)}>
          <BrandMark className="h-3" />
          <div className={cn('h-1.5 w-full rounded-sm', p.line)} />
          <div className={cn('h-1.5 w-2/3 rounded-sm', p.line)} />
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-2">
          <div className="ml-auto h-3 w-2/3 rounded-md bg-brand" />
          <div className={cn('h-1.5 w-full rounded-sm', p.line)} />
          <div className={cn('h-1.5 w-4/5 rounded-sm', p.line)} />
          <div className={cn('h-1.5 w-3/5 rounded-sm', p.line)} />
        </div>
      </div>
      <div className={cn('flex items-center gap-2 border-t px-3 py-2', p.border)}>
        <span
          className={cn(
            'flex size-4 items-center justify-center rounded-full border-2',
            isActive ? 'border-brand' : p.dotIdle,
          )}
        >
          {isActive && <span className="size-2 rounded-full bg-brand" />}
        </span>
        <span className={cn('text-sm font-medium', p.text)}>{label}</span>
      </div>
    </button>
  )
}
