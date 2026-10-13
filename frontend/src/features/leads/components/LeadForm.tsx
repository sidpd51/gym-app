import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { DatePicker } from '@/components/common/DatePicker'
import { FormSelect } from '@/components/common/FormSelect'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ApiError } from '@/lib/api'
import { useMembershipPlans } from '../../membership-plans/hooks/useMembershipPlans'
import { leadRepository } from '../api/leads.repository'
import { leadSchema, type LeadFormValues } from '../schemas/lead.schema'
import { LEAD_SOURCE_LABELS } from '../types/lead.types'
import type { LeadSource } from '../types/lead.types'

const SOURCE_OPTIONS = Object.entries(LEAD_SOURCE_LABELS) as [LeadSource, string][]

function inputCls(hasError: boolean) {
  return cn(
    'w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60',
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

interface LeadFormProps {
  mode: 'create' | 'edit'
  /** Required in edit mode (PATCH /api/v1/leads/{id}). */
  leadId?: string
  defaultValues?: Partial<LeadFormValues>
  onCancel: () => void
  successRedirectTo?: string
}

export function LeadForm({
  mode,
  leadId,
  defaultValues,
  onCancel,
  successRedirectTo = '/leads',
}: LeadFormProps) {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const { plans, isLoading: plansLoading } = useMembershipPlans()
  const activePlans = plans.filter((p) => p.status === 'ACTIVE')

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      source: '',
      interestedPlanId: '',
      nextFollowUpDate: '',
      notes: '',
      ...defaultValues,
    },
  })

  async function onSubmit(data: LeadFormValues) {
    setServerError(null)
    try {
      if (mode === 'create') {
        await leadRepository.create({
          name: data.name,
          phone: data.phone,
          email: data.email || undefined,
          source: (data.source || undefined) as LeadSource | undefined,
          interestedPlanId: data.interestedPlanId || undefined,
          nextFollowUpDate: data.nextFollowUpDate || undefined,
          notes: data.notes || undefined,
        })
      } else {
        if (!leadId) {
          setServerError('Missing lead id.')
          return
        }
        await leadRepository.update(leadId, {
          name: data.name,
          phone: data.phone,
          email: data.email || undefined,
          source: (data.source || undefined) as LeadSource | undefined,
          interestedPlanId: data.interestedPlanId || undefined,
          nextFollowUpDate: data.nextFollowUpDate || undefined,
          notes: data.notes || undefined,
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
      aria-label={mode === 'create' ? 'Create lead form' : 'Edit lead form'}
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

        {/* Contact Information */}
        <SectionCard title="Contact Information">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Name" required htmlFor="name" error={errors.name?.message}>
                <input
                  id="name"
                  type="text"
                  placeholder="e.g. Rahul Kumar"
                  className={inputCls(!!errors.name)}
                  {...register('name')}
                />
              </Field>
            </div>

            <Field label="Phone" required htmlFor="phone" error={errors.phone?.message}>
              <input
                id="phone"
                type="tel"
                placeholder="e.g. 9876543210"
                className={inputCls(!!errors.phone)}
                {...register('phone')}
              />
            </Field>

            <Field label="Email" htmlFor="email" error={errors.email?.message}>
              <input
                id="email"
                type="email"
                placeholder="e.g. rahul@example.com"
                className={inputCls(!!errors.email)}
                {...register('email')}
              />
            </Field>
          </div>
        </SectionCard>

        {/* Lead Information */}
        <SectionCard title="Lead Information">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Source" htmlFor="source" error={errors.source?.message}>
              <FormSelect
                id="source"
                error={!!errors.source}
                {...register('source')}
              >
                <option value="">Select source</option>
                {SOURCE_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </FormSelect>
            </Field>

            <Field
              label="Interested Plan"
              htmlFor="interestedPlanId"
              error={errors.interestedPlanId?.message}
            >
              <FormSelect
                id="interestedPlanId"
                error={!!errors.interestedPlanId}
                disabled={plansLoading}
                {...register('interestedPlanId')}
              >
                <option value="">
                  {plansLoading ? 'Loading plans…' : 'Select plan'}
                </option>
                {activePlans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ₹{p.price.toLocaleString('en-IN')}
                  </option>
                ))}
              </FormSelect>
            </Field>
          </div>
        </SectionCard>

        {/* Follow-up */}
        <SectionCard title="Follow-up">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Next Follow-up Date"
              htmlFor="nextFollowUpDate"
              error={errors.nextFollowUpDate?.message}
            >
              <Controller
                name="nextFollowUpDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    error={!!errors.nextFollowUpDate}
                  />
                )}
              />
            </Field>
          </div>
        </SectionCard>

        {/* Notes */}
        <SectionCard title="Notes">
          <Field label="Notes" htmlFor="notes" error={errors.notes?.message}>
            <textarea
              id="notes"
              rows={3}
              placeholder="Any additional information about this lead"
              className={cn(inputCls(!!errors.notes), 'resize-none')}
              {...register('notes')}
            />
          </Field>
        </SectionCard>

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
            {isSubmitting
              ? mode === 'create'
                ? 'Creating…'
                : 'Saving…'
              : mode === 'create'
                ? 'Create Lead'
                : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  )
}
