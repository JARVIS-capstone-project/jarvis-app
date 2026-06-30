import type { ReactNode } from 'react'
import { cn } from '@shared/lib/cn'

/** Shared size scale for form controls (mirrors Button). */
export type FieldSize = 'sm' | 'md' | 'lg'

type FieldShellProps = {
  label?: string
  helperText?: string
  error?: string
  htmlFor?: string
  children: ReactNode
}

/**
 * Layout shared by Input/Textarea: optional label above the control and a
 * helper/error message below. Error message takes priority over helper text.
 */
export function FieldShell({ label, helperText, error, htmlFor, children }: FieldShellProps) {
  const message = error || helperText
  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-medium text-heading">
          {label}
        </label>
      )}
      {children}
      {message && <p className={cn('text-xs', error ? 'text-danger' : 'text-muted')}>{message}</p>}
    </div>
  )
}
