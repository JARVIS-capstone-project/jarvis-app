import { create } from 'zustand'

/**
 * Which surface the settings modal should open on.
 *   - 'account'     → Account tab
 *   - 'theme'       → General tab, scrolled to the Theme section
 *   - 'connections' → Connections tab
 */
export type SettingsSection = 'account' | 'theme' | 'connections'

/**
 * Open/closed state for the settings modal, lifted out of the sidebar.
 *
 * The modal used to be owned by `SidebarUser`, which was fine while that row
 * was the only way in. The chat composer's MCP menu now needs to reach the
 * Connections tab too, and a modal owned by one of its two callers would
 * have to be mounted twice — two dialogs, two focus traps, and whichever
 * one was mounted second winning. One store, one host at the app root.
 */
interface SettingsState {
  open: boolean
  section?: SettingsSection
  show: (section?: SettingsSection) => void
  hide: () => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  open: false,
  section: undefined,
  show: (section) => set({ open: true, section }),
  hide: () => set({ open: false }),
}))

/** Imperative entry point, callable from event handlers outside components. */
export const settings = {
  open: (section?: SettingsSection) => useSettingsStore.getState().show(section),
  close: () => useSettingsStore.getState().hide(),
}
