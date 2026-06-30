import { createContext, useContext } from 'react'

export type Theme = 'light' | 'dark'

export type ThemeContextValue = {
  theme: Theme
  toggle: () => void
  setTheme: (t: Theme) => void
}

// Kept separate from the provider so the provider file exports only a component
// (keeps React Fast Refresh happy).
export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>')
  return ctx
}
