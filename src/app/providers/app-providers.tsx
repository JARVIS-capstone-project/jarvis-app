import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router'
import { ThemeProvider } from '@app/providers/theme-provider'

interface AppProvidersProps {
  children: ReactNode
}

/**
 * Single composition point for app-wide providers (router, query client,
 * theme, etc.). Add new providers here rather than in `main.tsx`.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <BrowserRouter>{children}</BrowserRouter>
    </ThemeProvider>
  )
}
