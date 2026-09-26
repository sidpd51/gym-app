import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GymSettings } from '../types/settings.types'
import { gymProfileSchema, type GymProfileFormValues } from '../schemas/settings.schema'

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

interface GymProfileSettingsProps {
  settings: GymSettings
  onSave: (updated: GymSettings) => void
}

export function GymProfileSettings({ settings, onSave }: GymProfileSettingsProps) {
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<GymProfileFormValues>({
    resolver: zodResolver(gymProfileSchema),
    defaultValues: {
      gymName: settings.gymName,
      phone: settings.phone ?? '',
      email: settings.email ?? '',
      address: settings.address ?? '',
    },
  })

  function onSubmit(data: GymProfileFormValues) {
    onSave({
      ...settings,
      gymName: data.gymName.trim(),
      phone: data.phone.trim() || undefined,
      email: data.email.trim() || undefined,
      address: data.address.trim() || undefined,
    })
    reset({
      gymName: data.gymName.trim(),
      phone: data.phone.trim(),
      email: data.email.trim(),
      address: data.address.trim(),
    })
    setSaved(true)
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="Gym profile settings form"
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

        <SectionCard title="Gym Identity">
          <Field
            label="Gym Name"
            required
            htmlFor="gymName"
            error={errors.gymName?.message}
          >
            <input
              id="gymName"
              type="text"
              placeholder="e.g. FitZone Gym"
              className={inputCls(!!errors.gymName)}
              {...register('gymName')}
            />
          </Field>
        </SectionCard>

        <SectionCard title="Contact Information">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Phone" htmlFor="phone" error={errors.phone?.message}>
              <input
                id="phone"
                type="tel"
                placeholder="e.g. 9876543210"
                className={inputCls(!!errors.phone)}
                {...register('phone')}
              />
            </Field>

            <Field label="Email" htmlFor="email" error={errors.email?.message}>
              <input
                id="email"
                type="email"
                placeholder="e.g. contact@fitzone.example"
                className={inputCls(!!errors.email)}
                {...register('email')}
              />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Address" htmlFor="address" error={errors.address?.message}>
                <textarea
                  id="address"
                  rows={3}
                  placeholder="e.g. 12 Main Road, Ranchi, Jharkhand"
                  className={cn(inputCls(!!errors.address), 'resize-none')}
                  {...register('address')}
                />
              </Field>
            </div>
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
