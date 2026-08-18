import { useState } from 'react'
import { Check, Info } from 'lucide-react'
import { adminUsersService } from '@modules/admin/api/admin-users-service'
import { Button } from '@shared/ui/button'
import { HttpApiError } from '@shared/api/http-client'
import { toast } from '@shared/model/toast-store'
import { cn } from '@shared/lib/cn'

/**
 * Sets a user's job-role persona.
 *
 * The four values are the literal strings `JobRole.fromValue` matches on —
 * note the slash in "IT/technical" — not the proto enum names. Anything else
 * comes back 400.
 *
 * **This control is write-only, and the UI says so.** `AdminUserView` carries
 * id/email/roles/status/createdAt and nothing from the workspace module, and
 * no admin endpoint reads a profile, so the current persona genuinely cannot
 * be shown. Preselecting a guess would be worse than admitting the gap: an
 * admin would read the default as fact and "confirm" a value that was never
 * set. Once platform exposes the profile, seed `selected` from it and delete
 * the notice.
 */
const ROLES = [
  { value: 'IT/technical', hint: 'Default at registration. Systems-level framing.' },
  { value: 'Business', hint: 'Impact and stakeholder framing over internals.' },
  { value: 'BA', hint: 'Requirements and process framing.' },
  { value: 'PA', hint: 'Scheduling and coordination framing.' },
] as const

interface Props {
  userId: string
}

export function JobRolePicker({ userId }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  // What we last wrote in this session — the only value we can honestly claim.
  const [lastSaved, setLastSaved] = useState<string | null>(null)

  const save = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await adminUsersService.updateJobRole(userId, selected)
      setLastSaved(selected)
      toast.success(`Job role set to ${selected}`)
    } catch (err) {
      const detail = err instanceof HttpApiError ? err.detail : null
      toast.danger(detail ?? 'Could not update job role')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-divider bg-panel p-4">
      <header>
        <h3 className="font-display text-sm uppercase tracking-widest text-heading">
          Job role
        </h3>
        <p className="mt-0.5 text-xs text-muted">
          Biases the agent's tone and framing. Never affects what the user can access.
        </p>
      </header>

      <p className="flex items-start gap-2 rounded-md border border-divider bg-surface px-2.5 py-2 text-xs text-muted">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        <span>
          The platform API does not expose a user&apos;s current job role, so none is
          preselected. Choosing one overwrites whatever is set.
        </span>
      </p>

      <div className="flex flex-col gap-1">
        {ROLES.map(({ value, hint }) => {
          const isSelected = selected === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => setSelected(value)}
              aria-pressed={isSelected}
              className={cn(
                'flex items-start gap-2.5 rounded-md border px-3 py-2 text-left transition-colors',
                isSelected
                  ? 'border-brand/50 bg-brand-glow-soft'
                  : 'border-transparent hover:bg-hover',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border',
                  isSelected ? 'border-brand bg-brand text-white' : 'border-divider',
                )}
              >
                {isSelected && <Check className="size-2.5" />}
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    'block text-sm',
                    isSelected ? 'text-heading' : 'text-body',
                  )}
                >
                  {value}
                  {lastSaved === value && (
                    <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-success">
                      saved
                    </span>
                  )}
                </span>
                <span className="block text-xs text-muted">{hint}</span>
              </span>
            </button>
          )
        })}
      </div>

      <Button
        size="sm"
        onClick={save}
        disabled={!selected || selected === lastSaved}
        isLoading={saving}
        className="self-start"
      >
        {selected === lastSaved && lastSaved !== null ? 'Saved' : 'Apply job role'}
      </Button>
    </section>
  )
}
