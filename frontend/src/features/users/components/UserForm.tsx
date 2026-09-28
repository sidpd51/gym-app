import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { FormSelect } from '@/components/common/FormSelect'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { USER_ROLES, USER_STATUSES } from '../types/user.types'
import { userSchema, type UserFormValues } from '../schemas/user.schema'

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

interface UserFormProps {
  mode: 'create' | 'edit'
  defaultValues?: Partial<UserFormValues>
  onCancel: () => void
  successRedirectTo?: string
  successMessage?: string
}

export function UserForm({
  mode,
  defaultValues,
  onCancel,
  successRedirectTo = '/users',
  successMessage = mode === 'create' ? 'User created successfully.' : 'User updated successfully.',
}: UserFormProps) {
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'OWNER',
      status: 'ACTIVE',
      ...defaultValues,
    },
  })

  function onSubmit(data: UserFormValues) {
    console.log(`[UserForm:${mode}]`, data)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-6 py-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" aria-hidden="true" />
        <h3 className="mt-3 text-base font-semibold text-green-800">
          {mode === 'create' ? 'User created' : 'Changes saved'}
        </h3>
        <p className="mt-1 text-sm text-green-700">{successMessage}</p>
        <p className="mt-1 text-xs text-green-600">
          Backend integration will be added in a later phase. Changes have not been persisted.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="rounded-lg border border-green-300 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
          >
            {mode === 'create' ? 'Add Another' : 'Edit Again'}
          </button>
          <Link
            to={successRedirectTo}
            className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
          >
            Back to Users
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="User form">
      <div className="space-y-5">
        {/* Identity */}
        <SectionCard title="Personal Information">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="First Name"
              required
              htmlFor="firstName"
              error={errors.firstName?.message}
            >
              <input
                id="firstName"
                type="text"
                autoComplete="given-name"
                placeholder="e.g. Arjun"
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
                autoComplete="family-name"
                placeholder="e.g. Mehta"
                className={inputCls(!!errors.lastName)}
                {...register('lastName')}
              />
            </Field>

            <Field label="Email" required htmlFor="email" error={errors.email?.message}>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="user@example.com"
                className={inputCls(!!errors.email)}
                {...register('email')}
              />
            </Field>

            <Field label="Phone" htmlFor="phone" error={errors.phone?.message}>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                placeholder="10-digit number"
                className={inputCls(!!errors.phone)}
                {...register('phone')}
              />
            </Field>
          </div>
        </SectionCard>

        {/* Account */}
        <SectionCard title="Account">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Role" required htmlFor="role" error={errors.role?.message}>
              <FormSelect id="role" error={!!errors.role} {...register('role')}>
                {USER_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </FormSelect>
            </Field>

            <Field label="Status" required htmlFor="status" error={errors.status?.message}>
              <FormSelect id="status" error={!!errors.status} {...register('status')}>
                {USER_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </FormSelect>
            </Field>
          </div>
        </SectionCard>

        {/* Actions */}
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
            {mode === 'create' ? 'Create User' : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  )
}
