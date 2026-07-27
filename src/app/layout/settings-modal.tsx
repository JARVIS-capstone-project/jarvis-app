import { useEffect } from 'react'
import { X } from 'lucide-react'
import { SettingsGeneralTab } from '@app/layout/settings-general-tab'
import { cn } from '@shared/lib/cn'

/**
 * Named anchors inside the settings modal. Passed via `initialSection` so
 * the caller can jump the modal straight to a section on open (e.g. the
 * user popover's Theme item opens Settings and scrolls to Theme).
 */
export type SettingsSection = 'profile' | 'theme'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
  /** Optional section to scroll into view on open. Default: top. */
  initialSection?: SettingsSection
}

interface Tab {
  key: string
  label: string
  enabled: boolean
}

const TABS: Tab[] = [
  { key: 'general', label: 'General', enabled: true },
  { key: 'account', label: 'Account', enabled: false },
  { key: 'privacy', label: 'Privacy', enabled: false },
  { key: 'billing', label: 'Billing', enabled: false },
]

/**
 * App settings surface. Split-pane modal: left rail lists tab sections,
 * right pane renders the active tab's content. Only 'General' is wired
 * today; the rest are placeholder rows with a 'coming soon' tooltip so
 * the shape stays visible for future work.
 *
 * Reusable: any caller can open this and optionally deep-link into a
 * named section via `initialSection`. Dismiss via backdrop click, ESC,
 * or the X button. Never traps focus — no forms inside yet.
 */
export function SettingsModal({
  open,
  onClose,
  initialSection,
}: SettingsModalProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-[70vh] w-[50vw] overflow-hidden rounded-2xl border border-divider bg-panel"
      >
        <aside className="flex w-56 shrink-0 flex-col gap-1 border-r border-divider bg-canvas p-3">
          <h2
            id="settings-modal-title"
            className="mb-2 px-3 pt-1 text-xs font-medium uppercase tracking-wider text-muted"
          >
            Settings
          </h2>
          {TABS.map((tab) => (
            <TabButton key={tab.key} tab={tab} isActive={tab.key === 'general'} />
          ))}
        </aside>

        <div className="relative flex min-h-0 flex-1 flex-col">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-md text-body transition-colors hover:bg-hover hover:text-heading"
          >
            <X className="size-4" />
          </button>
          <div className="flex-1 overflow-y-auto p-8">
            <SettingsGeneralTab initialSection={initialSection} />
          </div>
        </div>
      </div>
    </div>
  )
}

function TabButton({ tab, isActive }: { tab: Tab; isActive: boolean }) {
  return (
    <button
      type="button"
      disabled={!tab.enabled}
      title={tab.enabled ? undefined : `${tab.label} — coming soon`}
      className={cn(
        'flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors',
        !tab.enabled && 'cursor-not-allowed text-muted',
        tab.enabled && isActive && 'bg-hover font-medium text-heading',
        tab.enabled && !isActive && 'text-body hover:bg-hover hover:text-heading',
      )}
    >
      <span className="flex-1">{tab.label}</span>
    </button>
  )
}
