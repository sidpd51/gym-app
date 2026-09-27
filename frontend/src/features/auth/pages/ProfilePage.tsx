import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, KeyRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '../context/useAuth'
import { UserAvatar } from '@/features/users/components/UserAvatar'
import { UserRoleBadge } from '@/features/users/components/UserRoleBadge'
import { UserStatusBadge } from '@/features/users/components/UserStatusBadge'
import { profileSchema, type ProfileFormValues } from '@/features/users/schemas/user.schema'

function inputCls(hasError: boolean) {
  return cn(
    'w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2',
    hasError
      ? 'border-red-300 bg-red-50 focus:ring-red-400'
      : 'border-zinc-200 bg-white focus:ring-blue-500'
  )
}

function Field({
  label,
  required,
  error,
  htmlFor,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  htmlFor?: string
  children: React.ReactNode
}) {
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

function ReadOnlyRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <p className="text-sm font-medium text-zinc-500">{label}</p>
      <div className="text-sm text-zinc-900">{value}</div>
    </div>
  )
}

export function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phone: user?.phone ?? '',
    },
  })

  if (!user) return null

  function onSubmit(data: ProfileFormValues) {
    updateProfile({
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || undefined,
    })
    reset({ firstName: data.firstName, lastName: data.lastName, phone: data.phone })
    setSaved(true)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Profile</h1>
        <p className="mt-0.5 text-sm text-zinc-500">Your account information.</p>
      </div>

      {/* Identity header */}
      <div className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-white px-6 py-5">
        <UserAvatar firstName={user.firstName} lastName={user.lastName} size="lg" />
        <div>
          <p className="text-base font-semibold text-zinc-900">
            {user.firstName} {user.lastName}
          </p>
          <p className="mt-0.5 text-sm text-zinc-500">{user.email}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <UserRoleBadge role={user.role} />
            <UserStatusBadge status={user.status} />
          </div>
        </div>
      </div>

      {/* Read-only account info */}
      <SectionCard title="Account Information">
        <div className="divide-y divide-zinc-100">
          <ReadOnlyRow label="User Code" value={<span className="font-mono">{user.userCode}</span>} />
          <ReadOnlyRow label="Role" value={<UserRoleBadge role={user.role} />} />
          <ReadOnlyRow label="Status" value={<UserStatusBadge status={user.status} />} />
          <ReadOnlyRow label="Email" value={user.email} />
        </div>
        <p className="mt-3 text-xs text-zinc-400">
          Role, status, and email can only be changed by an administrator.
        </p>
      </SectionCard>

      {/* Editable profile info */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Edit profile form">
        <SectionCard title="Edit Profile">
          {saved && !isDirty && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              Profile updated successfully.
            </div>
          )}

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
                className={inputCls(!!errors.lastName)}
                {...register('lastName')}
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

          <div className="mt-4 flex justify-end gap-3">
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
        </SectionCard>
      </form>

      {/* Password placeholder */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-200">
            <KeyRound size={16} className="text-zinc-500" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-700">Password</p>
            <p className="mt-0.5 text-xs text-zinc-400">
              Password management will be available when backend authentication is connected.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
