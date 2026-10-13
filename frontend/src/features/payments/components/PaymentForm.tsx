import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { DatePicker } from '@/components/common/DatePicker'
import { FormSelect } from '@/components/common/FormSelect'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ApiError } from '@/lib/api'
import { useMembers } from '../../members/hooks/useMembers'
import { useMemberMemberships } from '../../memberships/hooks/useMemberships'
import { paymentRepository } from '../api/payments.repository'
import { recordPaymentSchema, type RecordPaymentFormValues } from '../schemas/payment.schema'
import { PAYMENT_METHOD_LABELS } from '../types/payment.types'
import type { PaymentMethod } from '../types/payment.types'

function getTodayString(): string {
  const d = new Date()
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${day}`
}

function formatLocalDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

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
  hint?: string
  children: React.ReactNode
  htmlFor?: string
}

function Field({ label, required, error, hint, children, htmlFor }: FieldProps) {
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

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
      <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  )
}

const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: PAYMENT_METHOD_LABELS.CASH },
  { value: 'UPI', label: PAYMENT_METHOD_LABELS.UPI },
  { value: 'CARD', label: PAYMENT_METHOD_LABELS.CARD },
  { value: 'BANK_TRANSFER', label: PAYMENT_METHOD_LABELS.BANK_TRANSFER },
]

interface PaymentFormProps {
  onCancel: () => void
  successRedirectTo?: string
}

export function PaymentForm({
  onCancel,
  successRedirectTo = '/payments',
}: PaymentFormProps) {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RecordPaymentFormValues>({
    resolver: zodResolver(recordPaymentSchema),
    defaultValues: {
      memberId: '',
      membershipId: '',
      amount: '',
      paymentMethod: '',
      paymentDate: getTodayString(),
      reference: '',
      notes: '',
    },
  })

  const memberId = watch('memberId')

  const { members, isLoading: membersLoading } = useMembers()
  const { memberships, isLoading: membershipsLoading } = useMemberMemberships(
    memberId || undefined,
  )

  useEffect(() => {
    setValue('membershipId', '')
  }, [memberId, setValue])

  async function onSubmit(data: RecordPaymentFormValues) {
    setServerError(null)
    try {
      await paymentRepository.create({
        memberId: data.memberId,
        membershipId: data.membershipId || undefined,
        amount: Number(data.amount),
        paymentMethod: data.paymentMethod as PaymentMethod,
        paymentDate: data.paymentDate,
        status: 'COMPLETED',
        reference: data.reference || undefined,
        notes: data.notes || undefined,
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
    <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Record payment form">
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

        <SectionCard title="Member & Membership">
          <div className="space-y-4">
            <Field label="Member" required htmlFor="memberId" error={errors.memberId?.message}>
              <FormSelect
                id="memberId"
                error={!!errors.memberId}
                disabled={membersLoading}
                {...register('memberId')}
              >
                <option value="">
                  {membersLoading ? 'Loading members…' : 'Select a member'}
                </option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName} — {m.memberCode}
                  </option>
                ))}
              </FormSelect>
            </Field>

            <Field
              label="Membership"
              htmlFor="membershipId"
              error={errors.membershipId?.message}
            >
              <FormSelect
                id="membershipId"
                error={!!errors.membershipId}
                disabled={!memberId || membershipsLoading}
                {...register('membershipId')}
              >
                <option value="">
                  {!memberId
                    ? 'Select a member first'
                    : membershipsLoading
                      ? 'Loading memberships…'
                      : memberships.length === 0
                        ? 'No memberships found for this member'
                        : 'Select a membership (optional)'}
                </option>
                {memberMembershipsList(memberships, formatLocalDate)}
              </FormSelect>
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="Payment Details">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Amount"
              required
              htmlFor="amount"
              hint="Amount in INR"
              error={errors.amount?.message}
            >
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-sm text-zinc-500">₹</span>
                <input
                  id="amount"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="1500"
                  className={inputCls(!!errors.amount)}
                  {...register('amount')}
                />
              </div>
            </Field>

            <Field
              label="Payment Method"
              required
              htmlFor="paymentMethod"
              error={errors.paymentMethod?.message}
            >
              <FormSelect
                id="paymentMethod"
                error={!!errors.paymentMethod}
                {...register('paymentMethod')}
              >
                <option value="">Select a method</option>
                {PAYMENT_METHOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </FormSelect>
            </Field>

            <Field
              label="Payment Date"
              required
              htmlFor="paymentDate"
              error={errors.paymentDate?.message}
            >
              <Controller
                name="paymentDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    error={!!errors.paymentDate}
                  />
                )}
              />
            </Field>

            <Field
              label="Reference"
              htmlFor="reference"
              hint="UPI/card/bank transfer ID (optional)"
              error={errors.reference?.message}
            >
              <input
                id="reference"
                type="text"
                placeholder="e.g. UPI/20260927/123456"
                className={inputCls(!!errors.reference)}
                {...register('reference')}
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="Notes">
          <Field label="Notes" htmlFor="notes" error={errors.notes?.message}>
            <textarea
              id="notes"
              rows={3}
              placeholder="Optional notes about this payment"
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
            disabled={isSubmitting || membersLoading}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Recording…' : 'Record Payment'}
          </button>
        </div>
      </div>
    </form>
  )
}

function memberMembershipsList(
  memberships: ReturnType<typeof useMemberMemberships>['memberships'],
  fmt: (s: string) => string,
) {
  return memberships.map((ms) => (
    <option key={ms.id} value={ms.id}>
      {ms.planName} — {fmt(ms.startDate)} → {fmt(ms.endDate)}
    </option>
  ))
}
