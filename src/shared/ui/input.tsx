import { useId, useState } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import { FieldShell } from '@shared/ui/field-shell'
import type { FieldSize } from '@shared/ui/field-shell'

// `size` is omitted from native attrs so we can reuse it as the scale union.
interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  helperText?: string
  error?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  size?: FieldSize
}

const sizeClasses: Record<FieldSize, string> = {
  sm: 'h-8 text-xs',
  md: 'h-10 text-sm',
  lg: 'h-12 text-base',
}

const iconSlot = 'pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-muted'

export function Input({
  label,
  helperText,
  error,
  leftIcon,
  rightIcon,
  size = 'md',
  type = 'text',
  id,
  className,
  disabled,
  ...props
}: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const isPassword = type === 'password'
  const [revealed, setRevealed] = useState(false)
  const effectiveType = isPassword ? (revealed ? 'text' : 'password') : type
  const hasRight = isPassword || Boolean(rightIcon)

  return (
    <FieldShell label={label} helperText={helperText} error={error} htmlFor={inputId}>
      <div className="relative w-full">
        {leftIcon && <span className={cn(iconSlot, 'left-3')}>{leftIcon}</span>}
        <input
          id={inputId}
          type={effectiveType}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          className={cn(
            'w-full rounded-md bg-surface text-body placeholder:text-muted',
            'border border-transparent transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
            'disabled:cursor-not-allowed disabled:opacity-50',
            sizeClasses[size],
            leftIcon ? 'pl-10' : 'pl-3.5',
            hasRight ? 'pr-10' : 'pr-3.5',
            error && 'border-danger focus-visible:ring-danger',
            className,
          )}
          {...props}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted hover:text-body"
          >
            {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        ) : (
          rightIcon && <span className={cn(iconSlot, 'right-3')}>{rightIcon}</span>
        )}
      </div>
    </FieldShell>
  )
}
