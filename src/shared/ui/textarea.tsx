import { useId, useLayoutEffect, useRef } from 'react'
import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@shared/lib/cn'
import { FieldShell } from '@shared/ui/field-shell'
import type { FieldSize } from '@shared/ui/field-shell'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  helperText?: string
  error?: string
  size?: FieldSize
  /** Grow with content instead of scrolling — for the chat composer. */
  autoGrow?: boolean
}

const sizeClasses: Record<FieldSize, string> = {
  sm: 'min-h-16 px-3 py-2 text-xs',
  md: 'min-h-20 px-3.5 py-2.5 text-sm',
  lg: 'min-h-24 px-4 py-3 text-base',
}

export function Textarea({
  label,
  helperText,
  error,
  size = 'md',
  autoGrow = false,
  id,
  className,
  value,
  onInput,
  ...props
}: TextareaProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const ref = useRef<HTMLTextAreaElement>(null)

  // Resize on programmatic (controlled) value changes.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !autoGrow) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [autoGrow, value])

  // Resize while typing (uncontrolled), then forward the event.
  const handleInput: TextareaHTMLAttributes<HTMLTextAreaElement>['onInput'] = (e) => {
    if (autoGrow) {
      const el = e.currentTarget
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }
    onInput?.(e)
  }

  return (
    <FieldShell label={label} helperText={helperText} error={error} htmlFor={fieldId}>
      <textarea
        id={fieldId}
        ref={ref}
        value={value}
        onInput={handleInput}
        aria-invalid={error ? true : undefined}
        className={cn(
          'w-full resize-y rounded-md bg-surface text-body placeholder:text-muted',
          'border border-transparent transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
          'disabled:cursor-not-allowed disabled:opacity-50',
          autoGrow && 'resize-none overflow-hidden',
          sizeClasses[size],
          error && 'border-danger focus-visible:ring-danger',
          className,
        )}
        {...props}
      />
    </FieldShell>
  )
}
