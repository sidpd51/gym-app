import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { DatePicker } from '@/components/common/DatePicker'
import { FormSelect } from '@/components/common/FormSelect'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ApiError } from '@/lib/api'
import { expenseRepository } from '../api/expenses.repository'
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

interface ExpenseFormProps {
  mode: 'create' | 'edit'
  /** Required in edit mode (PATCH /api/v1/expenses/{id}). */
  expenseId?: string
  defaultValues?: Partial<ExpenseFormValues>
  onCancel: () => void
  successRedirectTo?: string
}

export function ExpenseForm({
  mode,
  expenseId,
  defaultValues,
  onCancel,
  successRedirectTo = '/expenses',
}: ExpenseFormProps) {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const { categories, isLoading: categoriesLoading } = useExpenseCategories()
  const activeCategories = categories.filter((c) => c.status === 'ACTIVE')

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

  async function onSubmit(data: ExpenseFormValues) {
    setServerError(null)
    try {
      if (mode === 'create') {
        await expenseRepository.create({
          categoryId: data.categoryId,
          description: data.description,
          amount: Number(data.amount),
          expenseDate: data.expenseDate,
          paymentMethod: data.paymentMethod as ExpensePaymentMethod,
          vendor: data.vendor || undefined,
          notes: data.notes || undefined,
        })
      } else {
        if (!expenseId) {
          setServerError('Missing expense id.')
          return
        }
        await expenseRepository.update(expenseId, {
          categoryId: data.categoryId,
          description: data.description,
          amount: Number(data.amount),
          expenseDate: data.expenseDate,
          paymentMethod: data.paymentMethod as ExpensePaymentMethod,
          vendor: data.vendor || undefined,
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
      aria-label={mode === 'create' ? 'Record expense form' : 'Edit expense form'}
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

        <SectionCard title="Expense Information">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field
                label="Category"
                required
                htmlFor="categoryId"
                error={errors.categoryId?.message}
              >
                <FormSelect
                  id="categoryId"
                  error={!!errors.categoryId}
                  disabled={categoriesLoading}
                  {...register('categoryId')}
                >
                  <option value="">
                    {categoriesLoading ? 'Loading categories…' : 'Select category'}
                  </option>
                  {activeCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.description ? ` — ${c.description}` : ''}
                    </option>
                  ))}
                </FormSelect>
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
                <FormSelect
                  id="paymentMethod"
                  error={!!errors.paymentMethod}
                  {...register('paymentMethod')}
                >
                  <option value="">Select payment method</option>
                  {paymentMethodOptions.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </FormSelect>
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
                  placeholder="Any additional information"
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
            disabled={isSubmitting || categoriesLoading}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? mode === 'create'
                ? 'Recording…'
                : 'Saving…'
              : mode === 'create'
                ? 'Record Expense'
                : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  )
}
