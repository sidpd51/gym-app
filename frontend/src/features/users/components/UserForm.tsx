import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { FormSelect } from '@/components/common/FormSelect'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ApiError } from '@/lib/api'
import { USER_ROLES, USER_STATUSES } from '../types/user.types'
import { createUserSchema, userSchema, type UserFormValues } from '../schemas/user.schema'
import { userRepository } from '../api/users.repository'

function inputCls(hasError: boolean) {
  return cn(
    'w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60',
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
  /** Required in edit mode (PATCH /api/v1/users/{id}). */
  userId?: string
  defaultValues?: Partial<UserFormValues & { password?: string }>
  onCancel: () => void
  successRedirectTo?: string
}

export function UserForm({
  mode,
  userId,
  defaultValues,
  onCancel,
  successRedirectTo = '/users',
}: UserFormProps) {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues & { password?: string }>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver((mode === 'create' ? createUserSchema : userSchema) as any),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'OWNER',
      status: 'ACTIVE',
      ...(mode === 'create' ? { password: '' } : {}),
      ...defaultValues,
    },
  })

  async function onSubmit(data: UserFormValues & { password?: string }) {
    setServerError(null)
    try {
      if (mode === 'create') {
        if (!data.password) {
          setServerError('Password is required.')
          return
        }
        await userRepository.create({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone || undefined,
          role: data.role,
          password: data.password,
        })
      } else {
        if (!userId) {
          setServerError('Missing user id.')
          return
        }
        // Backend PATCH accepts firstName/lastName/phone/role/status (no email).
        await userRepository.update(userId, {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || undefined,
          role: data.role,
          status: data.status,
        })
      }
      navigate(successRedirectTo)
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message)
      } else if (err instanceof Error) {
        setServerError(err.message)
      } else {
        setServerError('Something went wrong. Please try again.')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="User form">
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
                disabled={mode === 'edit'}
                title={mode === 'edit' ? 'Email cannot be changed' : undefined}
                className={inputCls(!!errors.email)}
                {...register('email')}
              />
              {mode === 'edit' && (
                <p className="mt-1 text-xs text-zinc-500">Email cannot be changed.</p>
              )}
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

            {mode === 'create' && (
              <Field
                label="Password"
                required
                htmlFor="password"
                error={errors.password?.message}
              >
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Min 8 characters"
                  className={inputCls(!!errors.password)}
                  {...register('password')}
                />
              </Field>
            )}
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

            {mode === 'edit' && (
              <Field label="Status" required htmlFor="status" error={errors.status?.message}>
                <FormSelect id="status" error={!!errors.status} {...register('status')}>
                  {USER_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </FormSelect>
              </Field>
            )}
          </div>
          {mode === 'create' && (
            <p className="mt-3 text-xs text-zinc-500">
              New users are created with ACTIVE status.
            </p>
          )}
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
            {isSubmitting
              ? mode === 'create'
                ? 'Creating…'
                : 'Saving…'
              : mode === 'create'
                ? 'Create User'
                : 'Save Changes'}
          </button>
        </div>

        <p className="text-xs text-zinc-400">
          Back to <Link to="/users" className="underline hover:text-zinc-600">Users</Link>
        </p>
      </div>
    </form>
  )
}
