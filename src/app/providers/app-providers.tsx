import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router'

interface AppProvidersProps {
  children: ReactNode
}

/**
 * Single composition point for app-wide providers (router, query client,
 * theme, etc.). Add new providers here rather than in `main.tsx`.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return <BrowserRouter>{children}</BrowserRouter>
}
