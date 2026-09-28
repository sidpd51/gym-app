import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { DatePicker } from '@/components/common/DatePicker'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useExpenseCategories } from '../hooks/useExpenses'
import { expenseSchema, type ExpenseFormValues } from '../schemas/expense.schema'
import { EXPENSE_PAYMENT_METHOD_LABELS } from '../types/expense.types'
import type { ExpensePaymentMethod } from '../types/expense.types'

function getTodayString(): string {
  const d = new Date()
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${day}`
}

const paymentMethodOptions = Object.entries(EXPENSE_PAYMENT_METHOD_LABELS) as [
  ExpensePaymentMethod,
  string,
][]

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

interface ExpenseFormProps {
  mode: 'create' | 'edit'
  defaultValues?: Partial<ExpenseFormValues>
  onCancel: () => void
}

export function ExpenseForm({ mode, defaultValues, onCancel }: ExpenseFormProps) {
  const { categories } = useExpenseCategories()
  const activeCategories = categories.filter((c) => c.status === 'ACTIVE')
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      categoryId: '',
      description: '',
      amount: '',
      expenseDate: getTodayString(),
      paymentMethod: '',
      vendor: '',
      notes: '',
      ...defaultValues,
    },
  })

  function onSubmit(data: ExpenseFormValues) {
    console.log(`[ExpenseForm:${mode}] values:`, data)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-6 py-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" aria-hidden="true" />
        <h3 className="mt-3 text-base font-semibold text-green-800">
          {mode === 'create' ? 'Expense recorded successfully' : 'Expense updated successfully'}
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
              Record Another
            </button>
          )}
          <Link
            to="/expenses"
            className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
          >
            Back to Expenses
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label={mode === 'create' ? 'Record expense form' : 'Edit expense form'}
    >
      <div className="space-y-5">
        <SectionCard title="Expense Information">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field
                label="Category"
                required
                htmlFor="categoryId"
                error={errors.categoryId?.message}
              >
                <select
                  id="categoryId"
                  className={inputCls(!!errors.categoryId)}
                  {...register('categoryId')}
                >
                  <option value="">Select category…</option>
                  {activeCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.description ? ` — ${c.description}` : ''}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Field
                label="Description"
                required
                htmlFor="description"
                error={errors.description?.message}
              >
                <input
                  id="description"
                  type="text"
                  placeholder="e.g. Monthly electricity bill"
                  className={inputCls(!!errors.description)}
                  {...register('description')}
                />
              </Field>
            </div>

            <Field label="Amount" required htmlFor="amount" error={errors.amount?.message}>
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-sm text-zinc-500">₹</span>
                <input
                  id="amount"
                  type="number"
                  min={0.01}
                  step={0.01}
                  placeholder="0.00"
                  className={inputCls(!!errors.amount)}
                  {...register('amount')}
                />
              </div>
            </Field>

            <Field
              label="Expense Date"
              required
              htmlFor="expenseDate"
              error={errors.expenseDate?.message}
            >
              <Controller
                name="expenseDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    error={!!errors.expenseDate}
                  />
                )}
              />
            </Field>

            <div className="sm:col-span-2">
              <Field
                label="Payment Method"
                required
                htmlFor="paymentMethod"
                error={errors.paymentMethod?.message}
              >
                <select
                  id="paymentMethod"
                  className={inputCls(!!errors.paymentMethod)}
                  {...register('paymentMethod')}
                >
                  <option value="">Select payment method…</option>
                  {paymentMethodOptions.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Additional Details">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Vendor" htmlFor="vendor" error={errors.vendor?.message}>
              <input
                id="vendor"
                type="text"
                placeholder="e.g. City Electric Board"
                className={inputCls(!!errors.vendor)}
                {...register('vendor')}
              />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Notes" htmlFor="notes" error={errors.notes?.message}>
                <textarea
                  id="notes"
                  rows={3}
                  placeholder="Any additional information…"
                  className={cn(inputCls(!!errors.notes), 'resize-none')}
                  {...register('notes')}
                />
              </Field>
            </div>
          </div>
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
            {mode === 'create' ? 'Record Expense' : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  )
}
