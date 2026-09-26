import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createMemberSchema, type MemberFormValues } from '../schemas/member.schema'

const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'] as const

function inputCls(hasError: boolean) {
  return cn(
    'w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2',
    hasError
      ? 'border-red-300 bg-red-50 focus:ring-red-400'
      : 'border-zinc-200 bg-white focus:ring-blue-500'
  )
}

function selectCls(hasError: boolean) {
  return cn(
    'w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2',
    hasError
      ? 'border-red-300 bg-red-50 text-zinc-900 focus:ring-red-400'
      : 'border-zinc-200 bg-white text-zinc-900 focus:ring-blue-500'
  )
}

interface FieldProps {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
  htmlFor?: string
}

function Field({ label, required, error, children, htmlFor }: FieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-zinc-700">
        {label}
        {required && <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>}
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

interface MemberFormProps {
  onCancel: () => void
}

export function MemberForm({ onCancel }: MemberFormProps) {
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MemberFormValues>({
    resolver: zodResolver(createMemberSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      dateOfBirth: '',
      gender: '',
      address: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelationship: '',
      joiningDate: '',
    },
  })

  function onSubmit(data: MemberFormValues) {
    console.log('[CreateMember] form values:', data)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-6 py-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" aria-hidden="true" />
        <h3 className="mt-3 text-base font-semibold text-green-800">Form submitted successfully</h3>
        <p className="mt-1 text-sm text-green-700">
          Backend integration will be added in a later phase. The member has not been persisted.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="rounded-lg border border-green-300 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
          >
            Fill Again
          </button>
          <Link
            to="/members"
            className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
          >
            Back to Members
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Create member form">
      <div className="space-y-5">
        {/* Personal Information */}
        <SectionCard title="Personal Information">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="First Name" required htmlFor="firstName" error={errors.firstName?.message}>
              <input
                id="firstName"
                type="text"
                autoComplete="given-name"
                placeholder="e.g. Rahul"
                className={inputCls(!!errors.firstName)}
                {...register('firstName')}
              />
            </Field>

            <Field label="Last Name" required htmlFor="lastName" error={errors.lastName?.message}>
              <input
                id="lastName"
                type="text"
                autoComplete="family-name"
                placeholder="e.g. Kumar"
                className={inputCls(!!errors.lastName)}
                {...register('lastName')}
              />
            </Field>

            <Field label="Date of Birth" htmlFor="dateOfBirth" error={errors.dateOfBirth?.message}>
              <input
                id="dateOfBirth"
                type="date"
                max={new Date().toISOString().split('T')[0]}
                className={inputCls(!!errors.dateOfBirth)}
                {...register('dateOfBirth')}
              />
            </Field>

            <Field label="Gender" htmlFor="gender" error={errors.gender?.message}>
              <select
                id="gender"
                className={selectCls(!!errors.gender)}
                {...register('gender')}
              >
                <option value="">Select gender</option>
                {GENDER_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </SectionCard>

        {/* Contact Information */}
        <SectionCard title="Contact Information">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Phone" required htmlFor="phone" error={errors.phone?.message}>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                placeholder="10-digit number"
                className={inputCls(!!errors.phone)}
                {...register('phone')}
              />
            </Field>

            <Field label="Email" htmlFor="email" error={errors.email?.message}>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                className={inputCls(!!errors.email)}
                {...register('email')}
              />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Address" htmlFor="address" error={errors.address?.message}>
                <textarea
                  id="address"
                  rows={2}
                  autoComplete="street-address"
                  placeholder="Street, City, State, PIN"
                  className={cn(inputCls(!!errors.address), 'resize-none')}
                  {...register('address')}
                />
              </Field>
            </div>
          </div>
        </SectionCard>

        {/* Emergency Contact */}
        <SectionCard title="Emergency Contact">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field
              label="Contact Name"
              htmlFor="emergencyContactName"
              error={errors.emergencyContactName?.message}
            >
              <input
                id="emergencyContactName"
                type="text"
                placeholder="Full name"
                className={inputCls(!!errors.emergencyContactName)}
                {...register('emergencyContactName')}
              />
            </Field>

            <Field
              label="Contact Phone"
              htmlFor="emergencyContactPhone"
              error={errors.emergencyContactPhone?.message}
            >
              <input
                id="emergencyContactPhone"
                type="tel"
                placeholder="10-digit number"
                className={inputCls(!!errors.emergencyContactPhone)}
                {...register('emergencyContactPhone')}
              />
            </Field>

            <Field
              label="Relationship"
              htmlFor="emergencyContactRelationship"
              error={errors.emergencyContactRelationship?.message}
            >
              <input
                id="emergencyContactRelationship"
                type="text"
                placeholder="e.g. Spouse, Parent"
                className={inputCls(!!errors.emergencyContactRelationship)}
                {...register('emergencyContactRelationship')}
              />
            </Field>
          </div>
        </SectionCard>

        {/* Membership Information */}
        <SectionCard title="Membership Information">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            Create Member
          </button>
        </div>
      </div>
    </form>
  )
}
