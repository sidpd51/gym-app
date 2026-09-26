import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GymSettings } from '../types/settings.types'
import {
  attendanceSettingsSchema,
  type AttendanceSettingsFormValues,
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
  error?: string
  htmlFor?: string
  children: React.ReactNode
}

function Field({ label, error, htmlFor, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-zinc-700">
        {label}
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

function SectionCard({ title, description, children }: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
      <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
      {description && <p className="mt-0.5 text-xs text-zinc-500">{description}</p>}
      <div className="mt-4">{children}</div>
    </div>
  )
}

interface AttendanceSettingsProps {
  settings: GymSettings
  onSave: (updated: GymSettings) => void
}

export function AttendanceSettings({ settings, onSave }: AttendanceSettingsProps) {
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<AttendanceSettingsFormValues>({
    resolver: zodResolver(attendanceSettingsSchema),
    defaultValues: {
      attendanceStartTime: settings.attendanceStartTime ?? '',
      attendanceEndTime: settings.attendanceEndTime ?? '',
      allowAttendanceForExpiredMembership: settings.allowAttendanceForExpiredMembership,
    },
  })

  function onSubmit(data: AttendanceSettingsFormValues) {
    onSave({
      ...settings,
      attendanceStartTime: data.attendanceStartTime || undefined,
      attendanceEndTime: data.attendanceEndTime || undefined,
      allowAttendanceForExpiredMembership: data.allowAttendanceForExpiredMembership,
    })
    reset({
      attendanceStartTime: data.attendanceStartTime,
      attendanceEndTime: data.attendanceEndTime,
      allowAttendanceForExpiredMembership: data.allowAttendanceForExpiredMembership,
    })
    setSaved(true)
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="Attendance settings form"
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

        <SectionCard
          title="Operating Hours"
          description="Restrict check-in to specific times. Leave blank to allow check-in at any time."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Start Time"
              htmlFor="attendanceStartTime"
              error={errors.attendanceStartTime?.message}
            >
              <input
                id="attendanceStartTime"
                type="time"
                className={inputCls(!!errors.attendanceStartTime)}
                {...register('attendanceStartTime')}
              />
            </Field>

            <Field
              label="End Time"
              htmlFor="attendanceEndTime"
              error={errors.attendanceEndTime?.message}
            >
              <input
                id="attendanceEndTime"
                type="time"
                className={inputCls(!!errors.attendanceEndTime)}
                {...register('attendanceEndTime')}
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="Membership Access">
          <div className="flex items-start gap-4">
            <Controller
              name="allowAttendanceForExpiredMembership"
              control={control}
              render={({ field }) => (
                <button
                  type="button"
                  role="switch"
                  aria-checked={field.value}
                  onClick={() => field.onChange(!field.value)}
                  className={cn(
                    'relative mt-0.5 inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1',
                    field.value ? 'bg-zinc-900' : 'bg-zinc-200'
                  )}
                >
                  <span
                    className={cn(
                      'pointer-events-none absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
                      field.value ? 'translate-x-4' : 'translate-x-0.5'
                    )}
                  />
                </button>
              )}
            />
            <div>
              <p className="text-sm font-medium text-zinc-700">
                Allow Attendance for Expired Memberships
              </p>
              <p className="mt-0.5 text-xs text-zinc-400">
                If enabled, members with expired memberships can still check in.
              </p>
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
