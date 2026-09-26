import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GymSettings } from '../types/settings.types'
import {
  membershipSettingsSchema,
  type MembershipSettingsFormValues,
} from '../schemas/settings.schema'

function inputCls(hasError: boolean) {
  return cn(
    'w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2',
    hasError
      ? 'border-red-300 bg-red-50 focus:ring-red-400'
      : 'border-zinc-200 bg-white focus:ring-blue-500'
  )
}

interface FieldProps {
  label: string
  required?: boolean
  error?: string
  htmlFor?: string
  hint?: string
  children: React.ReactNode
}

function Field({ label, required, error, htmlFor, hint, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-zinc-700">
        {label}
        {required && (
          <span className="ml-0.5 text-red-500" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {hint && <p className="mt-0.5 text-xs text-zinc-400">{hint}</p>}
      <div className="mt-1">{children}</div>
      {error && (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
      <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  )
}

interface MembershipSettingsProps {
  settings: GymSettings
  onSave: (updated: GymSettings) => void
}

export function MembershipSettings({ settings, onSave }: MembershipSettingsProps) {
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<MembershipSettingsFormValues>({
    resolver: zodResolver(membershipSettingsSchema),
    defaultValues: {
      membershipGracePeriodDays: String(settings.membershipGracePeriodDays),
    },
  })

  function onSubmit(data: MembershipSettingsFormValues) {
    onSave({
      ...settings,
      membershipGracePeriodDays: parseInt(data.membershipGracePeriodDays.trim(), 10),
    })
    reset({ membershipGracePeriodDays: data.membershipGracePeriodDays.trim() })
    setSaved(true)
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="Membership settings form"
    >
      <div className="space-y-5">
        {saved && !isDirty && (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            Settings saved successfully.
          </div>
        )}
        {isDirty && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            You have unsaved changes.
          </div>
        )}

        <SectionCard title="Membership Configuration">
          <div className="max-w-xs">
            <Field
              label="Grace Period (Days)"
              required
              htmlFor="membershipGracePeriodDays"
              hint="Extra days allowed after membership expiry before access is revoked."
              error={errors.membershipGracePeriodDays?.message}
            >
              <input
                id="membershipGracePeriodDays"
                type="number"
                min={0}
                step={1}
                placeholder="0"
                className={inputCls(!!errors.membershipGracePeriodDays)}
                {...register('membershipGracePeriodDays')}
              />
            </Field>
          </div>
        </SectionCard>

        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={() => {
              reset()
              setSaved(false)
            }}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save Changes
          </button>
        </div>
      </div>
    </form>
  )
}
