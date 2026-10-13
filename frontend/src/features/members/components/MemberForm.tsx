import { useForm, Controller } from 'react-hook-form'
import { DatePicker } from '@/components/common/DatePicker'
import { FormSelect } from '@/components/common/FormSelect'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ApiError } from '@/lib/api'
import { createMemberSchema, type MemberFormValues } from '../schemas/member.schema'
import { memberRepository } from '../api/members.repository'

const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'] as const

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
  successRedirectTo?: string
}

export function MemberForm({ onCancel, successRedirectTo = '/members' }: MemberFormProps) {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
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

  async function onSubmit(data: MemberFormValues) {
    setServerError(null)
    try {
      await memberRepository.create({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email || undefined,
        joiningDate: data.joiningDate,
        dateOfBirth: data.dateOfBirth || undefined,
        gender: data.gender || undefined,
        address: data.address || undefined,
        emergencyContactName: data.emergencyContactName || undefined,
        emergencyContactPhone: data.emergencyContactPhone || undefined,
        emergencyContactRelationship: data.emergencyContactRelationship || undefined,
      })
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
    <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Create member form">
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
              <Controller
                name="dateOfBirth"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    error={!!errors.dateOfBirth}
                    disabled={{ after: new Date() }}
                  />
                )}
              />
            </Field>

            <Field label="Gender" htmlFor="gender" error={errors.gender?.message}>
              <FormSelect
                id="gender"
                error={!!errors.gender}
                {...register('gender')}
              >
                <option value="">Select gender</option>
                {GENDER_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </FormSelect>
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
            {isSubmitting ? 'Creating…' : 'Create Member'}
          </button>
        </div>
      </div>
    </form>
  )
}
