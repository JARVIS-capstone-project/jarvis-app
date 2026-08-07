import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { SettingsGeneralTab } from '@app/layout/settings-general-tab'
import { SettingsAccountTab } from '@app/layout/settings-account-tab'
import { cn } from '@shared/lib/cn'

type TabKey = 'general' | 'account' | 'privacy' | 'billing'

/**
 * Deep-link target for opening the modal on a specific surface. Values map:
 *   - 'account' → opens the Account tab
 *   - 'theme'   → opens the General tab and scrolls to the Theme section
 * Undefined → opens the General tab at the top.
 */
export type SettingsSection = 'account' | 'theme'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
  initialSection?: SettingsSection
}

interface Tab {
  key: TabKey
  label: string
  enabled: boolean
}

const TABS: Tab[] = [
  { key: 'general', label: 'General', enabled: true },
  { key: 'account', label: 'Account', enabled: true },
  { key: 'privacy', label: 'Privacy', enabled: false },
  { key: 'billing', label: 'Billing', enabled: false },
]

const sectionToTab = (section: SettingsSection | undefined): TabKey =>
  section === 'account' ? 'account' : 'general'

/**
 * App settings surface. Split-pane modal: left rail lists tab sections,
 * right pane renders the active tab. General + Account are wired today;
 * Privacy and Billing remain disabled placeholders so the shape stays
 * visible for future work.
 *
 * `initialSection` is honored once per open: opening the modal re-syncs the
 * active tab to the requested section. Users can freely tab-switch after
 * that without the prop dragging them back.
 */
export function SettingsModal({
  open,
  onClose,
  initialSection,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>(() =>
    sectionToTab(initialSection),
  )
  // Reset the active tab every time the modal transitions closed → open so a
  // caller can deep-link with `initialSection`. Uses the React "storing info
  // from previous renders" pattern (setState during render, not in effect) —
  // React bails out and re-renders with the new state before committing.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setActiveTab(sectionToTab(initialSection))
  }

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
            <TabButton
              key={tab.key}
              tab={tab}
              isActive={tab.key === activeTab}
              onSelect={() => setActiveTab(tab.key)}
            />
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
            {activeTab === 'general' && (
              <SettingsGeneralTab
                scrollTo={initialSection === 'theme' ? 'theme' : undefined}
              />
            )}
            {activeTab === 'account' && <SettingsAccountTab />}
          </div>
        </div>
      </div>
    </div>
  )
}

function TabButton({
  tab,
  isActive,
  onSelect,
}: {
  tab: Tab
  isActive: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      disabled={!tab.enabled}
      onClick={tab.enabled ? onSelect : undefined}
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
