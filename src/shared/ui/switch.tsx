import { useState } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@shared/lib/cn'

interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  /** Controlled value. Omit to use `defaultChecked` (uncontrolled). */
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

/** Toggle switch. Brand fill when on; controlled or uncontrolled (React idiom). */
export function Switch({
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled,
  className,
  ...props
}: SwitchProps) {
  const isControlled = checked !== undefined
  const [internal, setInternal] = useState(defaultChecked)
  const on = isControlled ? checked : internal

  const toggle = () => {
    if (disabled) return
    const next = !on
    if (!isControlled) setInternal(next)
    onCheckedChange?.(next)
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={toggle}
      className={cn(
        'relative inline-flex h-6 w-10 shrink-0 items-center rounded-full border transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
        'disabled:cursor-not-allowed disabled:opacity-50',
        on ? 'border-transparent bg-brand' : 'border-divider bg-surface',
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'inline-block size-5 rounded-full bg-white shadow transition-transform',
          on ? 'translate-x-[18px]' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}
