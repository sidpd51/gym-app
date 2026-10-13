import { useForm, Controller } from 'react-hook-form'
import { FormSelect } from '@/components/common/FormSelect'
import { DatePicker } from '@/components/common/DatePicker'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { ApiError } from '@/lib/api'
import { useMembershipPlans } from '../../membership-plans/hooks/useMembershipPlans'
import { membershipRepository } from '../api/memberships.repository'
import { createMembershipSchema, type CreateMembershipFormValues } from '../schemas/membership.schema'
import { MembershipSummary } from './MembershipSummary'

function getTodayString(): string {
  const d = new Date()
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${day}`
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + days)
  const ry = date.getFullYear()
  const rm = String(date.getMonth() + 1).padStart(2, '0')
  const rd = String(date.getDate()).padStart(2, '0')
  return `${ry}-${rm}-${rd}`
}

function formatLocalDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
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

interface MembershipFormProps {
  memberId: string
  onCancel: () => void
}

export function MembershipForm({ memberId, onCancel }: MembershipFormProps) {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const { plans, isLoading: plansLoading } = useMembershipPlans()
  const activePlans = plans.filter((p) => p.status === 'ACTIVE')

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateMembershipFormValues>({
    resolver: zodResolver(createMembershipSchema),
    defaultValues: { planId: '', startDate: getTodayString() },
  })

  const planId = watch('planId')
  const startDate = watch('startDate')
  const selectedPlan = activePlans.find((p) => p.id === planId) ?? null
  const endDate = selectedPlan && startDate.length === 10 ? addDays(startDate, selectedPlan.durationInDays) : null

  async function onSubmit(data: CreateMembershipFormValues) {
    setServerError(null)
    try {
      await membershipRepository.create({
        memberId,
        planId: data.planId,
        startDate: data.startDate,
      })
      navigate(`/members/${memberId}`)
    } catch (err) {
      if (err instanceof ApiError || err instanceof Error) {
        setServerError(err.message)
      } else {
        setServerError('Something went wrong. Please try again.')
      }
    }
  }

  if (plansLoading) {
    return (
      <div className="space-y-5" aria-label="Loading plans">
        <div className="h-8 w-64 animate-pulse rounded bg-zinc-100" />
        <div className="h-96 animate-pulse rounded-lg bg-zinc-100" />
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="Create membership form"
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
          <h2 className="text-sm font-semibold text-zinc-900">Plan & Date</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field
                label="Membership Plan"
                required
                htmlFor="planId"
                error={errors.planId?.message}
              >
                <FormSelect
                  id="planId"
                  error={!!errors.planId}
                  {...register('planId')}
                >
                  <option value="">Select a plan</option>
                  {activePlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} — {plan.durationInDays} days — ₹
                      {plan.price.toLocaleString('en-IN')}
                    </option>
                  ))}
                </FormSelect>
              </Field>
            </div>

            <Field
              label="Start Date"
              required
              htmlFor="startDate"
              error={errors.startDate?.message}
            >
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    error={!!errors.startDate}
                  />
                )}
              />
            </Field>

            <div>
              <label className="block text-sm font-medium text-zinc-700">End Date</label>
              <div className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500">
                {endDate ? formatLocalDate(endDate) : 'Auto-calculated'}
              </div>
            </div>
          </div>
        </div>

        {selectedPlan && endDate && (
          <MembershipSummary
            planName={selectedPlan.name}
            durationInDays={selectedPlan.durationInDays}
            startDate={startDate}
            endDate={endDate}
            amount={selectedPlan.price}
          />
        )}

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
            disabled={isSubmitting || plansLoading}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Creating…' : 'Create Membership'}
          </button>
        </div>
      </div>
    </form>
  )
}
