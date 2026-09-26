import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { trainerSchema, type TrainerFormValues } from '../schemas/trainer.schema'

function inputCls(hasError: boolean) {
  return cn(
    'w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2',
    hasError
      ? 'border-red-300 bg-red-50 focus:ring-red-400'
      : 'border-zinc-200 bg-white focus:ring-blue-500',
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
  defaultValues?: Partial<TrainerFormValues>
  onCancel: () => void
}

export function TrainerForm({ mode, defaultValues, onCancel }: TrainerFormProps) {
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
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

  function onSubmit(data: TrainerFormValues) {
    console.log(`[TrainerForm:${mode}] values:`, data)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-6 py-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" aria-hidden="true" />
        <h3 className="mt-3 text-base font-semibold text-green-800">
          {mode === 'create' ? 'Trainer created successfully' : 'Trainer updated successfully'}
        </h3>
        <p className="mt-1 text-sm text-green-700">
          Backend integration will be added in a later phase. Changes have not been persisted.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          {mode === 'create' && (
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="rounded-lg border border-green-300 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
            >
              Add Another
            </button>
          )}
          <Link
            to="/trainers"
            className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
          >
            Back to Trainers
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label={mode === 'create' ? 'Create trainer form' : 'Edit trainer form'}
    >
      <div className="space-y-5">
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
              <input
                id="joiningDate"
                type="date"
                className={inputCls(!!errors.joiningDate)}
                {...register('joiningDate')}
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
            {mode === 'create' ? 'Create Trainer' : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  )
}
