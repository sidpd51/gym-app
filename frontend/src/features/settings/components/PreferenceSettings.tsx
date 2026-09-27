import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PermissionGate } from '@/features/auth/components/PermissionGate'
import type { GymSettings, DateFormat } from '../types/settings.types'
import { preferencesSchema, type PreferencesFormValues } from '../schemas/settings.schema'

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
  children: React.ReactNode
}

function Field({ label, required, error, htmlFor, children }: FieldProps) {
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

function ReadOnlyField({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-zinc-700">{label}</p>
      <div className="mt-1 flex items-center rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
        <span className="text-sm text-zinc-700">{value}</span>
        <span className="ml-auto rounded bg-zinc-200 px-1.5 py-0.5 text-xs font-medium text-zinc-500">
          Read-only
        </span>
      </div>
      {note && <p className="mt-1 text-xs text-zinc-400">{note}</p>}
    </div>
  )
}

const DATE_FORMAT_OPTIONS: { value: DateFormat; label: string }[] = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY  (e.g. 27/09/2026)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY  (e.g. 09/27/2026)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD  (e.g. 2026-09-27)' },
]

interface PreferenceSettingsProps {
  settings: GymSettings
  onSave: (updated: GymSettings) => void
}

export function PreferenceSettings({ settings, onSave }: PreferenceSettingsProps) {
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      dateFormat: settings.dateFormat,
    },
  })

  function onSubmit(data: PreferencesFormValues) {
    onSave({
      ...settings,
      dateFormat: data.dateFormat as DateFormat,
    })
    reset({ dateFormat: data.dateFormat })
    setSaved(true)
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="Preferences settings form"
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

        <SectionCard title="Display Preferences">
          <div className="space-y-5">
            <ReadOnlyField
              label="Currency"
              value="INR (₹) — Indian Rupee"
              note="Only INR is supported in this version."
            />

            <ReadOnlyField
              label="Timezone"
              value="Asia/Kolkata (UTC+05:30)"
              note="Timezone management is not available in this version."
            />

            <Field
              label="Date Format"
              required
              htmlFor="dateFormat"
              error={errors.dateFormat?.message}
            >
              <select
                id="dateFormat"
                className={inputCls(!!errors.dateFormat)}
                {...register('dateFormat')}
              >
                {DATE_FORMAT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
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
          <PermissionGate permission="settings:edit">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save Changes
            </button>
          </PermissionGate>
        </div>
      </div>
    </form>
  )
}
