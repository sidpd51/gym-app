import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FormSelect } from '@/components/common/FormSelect'
import { ApiError } from '@/lib/api'
import { membershipPlanSchema, type MembershipPlanFormValues } from '../schemas/membership-plan.schema'
import { membershipPlanRepository } from '../api/membership-plans.repository'

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
  hint?: string
  children: React.ReactNode
  htmlFor?: string
}

function Field({ label, required, error, hint, children, htmlFor }: FieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-zinc-700">
        {label}
        {required && <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>}
      </label>
      {hint && <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>}
      <div className="mt-1">{children}</div>
      {error && (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

interface MembershipPlanFormProps {
  mode: 'create' | 'edit'
  /** Required in edit mode (PATCH /api/v1/membership-plans/{id}). */
  planId?: string
  defaultValues?: Partial<MembershipPlanFormValues>
  onCancel: () => void
  successRedirectTo?: string
}

export function MembershipPlanForm({
  mode,
  planId,
  defaultValues,
  onCancel,
  successRedirectTo = '/membership-plans',
}: MembershipPlanFormProps) {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MembershipPlanFormValues>({
    resolver: zodResolver(membershipPlanSchema),
    defaultValues: {
      name: '',
      description: '',
      durationInDays: '',
      price: '',
      ...(mode === 'edit' ? { status: 'ACTIVE' as const } : {}),
      ...defaultValues,
    },
  })

  async function onSubmit(data: MembershipPlanFormValues) {
    setServerError(null)
    try {
      if (mode === 'create') {
        await membershipPlanRepository.create({
          name: data.name,
          description: data.description || undefined,
          durationInDays: Number(data.durationInDays),
          price: Number(data.price),
        })
      } else {
        if (!planId) {
          setServerError('Missing plan id.')
          return
        }
        await membershipPlanRepository.update(planId, {
          name: data.name,
          description: data.description || undefined,
          durationInDays: Number(data.durationInDays),
          price: Number(data.price),
          status: data.status,
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
      aria-label={mode === 'create' ? 'Create membership plan form' : 'Edit membership plan form'}
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

        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
          <h2 className="text-sm font-semibold text-zinc-900">Plan Details</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Plan Name" required htmlFor="name" error={errors.name?.message}>
                <input
                  id="name"
                  type="text"
                  placeholder="e.g. Monthly Basic"
                  className={inputCls(!!errors.name)}
                  {...register('name')}
                />
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Field label="Description" htmlFor="description" error={errors.description?.message}>
                <textarea
                  id="description"
                  rows={2}
                  placeholder="Brief description of what the plan includes"
                  className={cn(inputCls(!!errors.description), 'resize-none')}
                  {...register('description')}
                />
              </Field>
            </div>

            <Field
              label="Duration"
              required
              htmlFor="durationInDays"
              hint="Number of days"
              error={errors.durationInDays?.message}
            >
              <div className="flex items-center gap-2">
                <input
                  id="durationInDays"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="30"
                  className={inputCls(!!errors.durationInDays)}
                  {...register('durationInDays')}
                />
                <span className="shrink-0 text-sm text-zinc-500">days</span>
              </div>
            </Field>

            <Field
              label="Price"
              required
              htmlFor="price"
              hint="Amount in INR"
              error={errors.price?.message}
            >
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-sm text-zinc-500">₹</span>
                <input
                  id="price"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="1500"
                  className={inputCls(!!errors.price)}
                  {...register('price')}
                />
              </div>
            </Field>

            {mode === 'edit' && (
              <Field label="Status" required htmlFor="status" error={errors.status?.message}>
                <FormSelect id="status" error={!!errors.status} {...register('status')}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </FormSelect>
              </Field>
            )}
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
                ? 'Create Plan'
                : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  )
}
