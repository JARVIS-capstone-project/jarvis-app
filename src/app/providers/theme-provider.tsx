import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import { ThemeContext } from '@app/providers/theme-context'
import type { Theme } from '@app/providers/theme-context'

/** Read the theme already applied to <html> by the pre-paint script in index.html. */
function currentTheme(): Theme {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  try {
    localStorage.setItem('theme', theme)
  } catch {
    // ignore — private mode / storage disabled
  }
}

/**
 * App-wide theme state. The initial value mirrors the class the FOUC script
 * already set, so there's no flash and no double source of truth.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(currentTheme)

  const setTheme = useCallback((t: Theme) => {
    applyTheme(t)
    setThemeState(t)
  }, [])

  const toggle = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark'
      applyTheme(next)
      return next
    })
  }, [])

  return <ThemeContext.Provider value={{ theme, toggle, setTheme }}>{children}</ThemeContext.Provider>
}
