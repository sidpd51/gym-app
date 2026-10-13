import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { DatePicker } from '@/components/common/DatePicker'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ApiError } from '@/lib/api'
import { trainerRepository } from '../api/trainers.repository'
import { trainerSchema, type TrainerFormValues } from '../schemas/trainer.schema'

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

interface TrainerFormProps {
  mode: 'create' | 'edit'
  /** Required in edit mode (PATCH /api/v1/trainers/{id}). */
  trainerId?: string
  defaultValues?: Partial<TrainerFormValues>
  onCancel: () => void
  successRedirectTo?: string
}

export function TrainerForm({
  mode,
  trainerId,
  defaultValues,
  onCancel,
  successRedirectTo = '/trainers',
}: TrainerFormProps) {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TrainerFormValues>({
    resolver: zodResolver(trainerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      specialization: '',
      joiningDate: '',
      ...defaultValues,
    },
  })

  async function onSubmit(data: TrainerFormValues) {
    setServerError(null)
    try {
      if (mode === 'create') {
        await trainerRepository.create({
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          email: data.email || undefined,
          specialization: data.specialization || undefined,
          joiningDate: data.joiningDate,
        })
      } else {
        if (!trainerId) {
          setServerError('Missing trainer id.')
          return
        }
        await trainerRepository.update(trainerId, {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          email: data.email || undefined,
          specialization: data.specialization || undefined,
        })
      }
      navigate(successRedirectTo)
    } catch (err) {
      if (err instanceof ApiError || err instanceof Error) {
        setServerError(err.message)
      } else {
        setServerError('Something went wrong. Please try again.')
      }
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label={mode === 'create' ? 'Create trainer form' : 'Edit trainer form'}
    >
      <div className="space-y-5">
        {serverError && (
          <div
            className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {serverError}
          </div>
        )}

        {/* Personal Information */}
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
          <h2 className="text-sm font-semibold text-zinc-900">Personal Information</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="First Name"
              required
              htmlFor="firstName"
              error={errors.firstName?.message}
            >
              <input
                id="firstName"
                type="text"
                placeholder="e.g. Rahul"
                className={inputCls(!!errors.firstName)}
                {...register('firstName')}
              />
            </Field>

            <Field
              label="Last Name"
              required
              htmlFor="lastName"
              error={errors.lastName?.message}
            >
              <input
                id="lastName"
                type="text"
                placeholder="e.g. Verma"
                className={inputCls(!!errors.lastName)}
                {...register('lastName')}
              />
            </Field>
          </div>
        </div>

        {/* Contact Information */}
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
          <h2 className="text-sm font-semibold text-zinc-900">Contact Information</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Phone"
              required
              htmlFor="phone"
              error={errors.phone?.message}
            >
              <input
                id="phone"
                type="tel"
                placeholder="e.g. 9876543210"
                className={inputCls(!!errors.phone)}
                {...register('phone')}
              />
            </Field>

            <Field
              label="Email"
              htmlFor="email"
              error={errors.email?.message}
            >
              <input
                id="email"
                type="email"
                placeholder="e.g. rahul@gymapp.com"
                className={inputCls(!!errors.email)}
                {...register('email')}
              />
            </Field>
          </div>
        </div>

        {/* Professional Information */}
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
          <h2 className="text-sm font-semibold text-zinc-900">Professional Information</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Specialization"
              htmlFor="specialization"
              error={errors.specialization?.message}
            >
              <input
                id="specialization"
                type="text"
                placeholder="e.g. Strength Training"
                className={inputCls(!!errors.specialization)}
                {...register('specialization')}
              />
            </Field>

            <Field
              label="Joining Date"
              required
              htmlFor="joiningDate"
              error={errors.joiningDate?.message}
            >
              <Controller
                name="joiningDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    error={!!errors.joiningDate}
                  />
                )}
              />
            </Field>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? mode === 'create'
                ? 'Creating…'
                : 'Saving…'
              : mode === 'create'
                ? 'Create Trainer'
                : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  )
}
