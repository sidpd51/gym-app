import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { DatePicker } from '@/components/common/DatePicker'
import { FormSelect } from '@/components/common/FormSelect'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMembershipPlans } from '../../membership-plans/hooks/useMembershipPlans'
import { leadSchema, type LeadFormValues } from '../schemas/lead.schema'
import { LEAD_SOURCE_LABELS } from '../types/lead.types'
import type { LeadSource } from '../types/lead.types'

const SOURCE_OPTIONS = Object.entries(LEAD_SOURCE_LABELS) as [LeadSource, string][]

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
  defaultValues?: Partial<LeadFormValues>
  onCancel: () => void
}

export function LeadForm({ mode, defaultValues, onCancel }: LeadFormProps) {
  const { plans } = useMembershipPlans()
  const activePlans = plans.filter((p) => p.status === 'ACTIVE')
  const [submitted, setSubmitted] = useState(false)

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

  function onSubmit(data: LeadFormValues) {
    console.log(`[LeadForm:${mode}] values:`, data)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-6 py-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" aria-hidden="true" />
        <h3 className="mt-3 text-base font-semibold text-green-800">
          {mode === 'create' ? 'Lead created successfully' : 'Lead updated successfully'}
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
            to="/leads"
            className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
          >
            Back to Leads
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label={mode === 'create' ? 'Create lead form' : 'Edit lead form'}
    >
      <div className="space-y-5">
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
                <option value="">Select source…</option>
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
                {...register('interestedPlanId')}
              >
                <option value="">Select plan…</option>
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
              placeholder="Any additional information about this lead…"
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
            disabled={isSubmitting}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mode === 'create' ? 'Create Lead' : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  )
}
