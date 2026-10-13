import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ApiError } from '@/lib/api'
import { DatePicker } from '@/components/common/DatePicker'
import { FormSelect } from '@/components/common/FormSelect'
import { useInventoryTransactions } from '../hooks/useInventory'
import { inventoryRepository } from '../api/inventory.repository'
import {
  INVENTORY_TRANSACTION_TYPE_LABELS,
} from '../types/inventory.types'
import type { InventoryTransactionType } from '../types/inventory.types'

const transactionSchema = z.object({
  type: z.string().min(1, 'Please select a type'),
  quantity: z
    .string()
    .refine((v) => v.length > 0 && !isNaN(Number(v)) && Number(v) > 0, 'Enter a quantity greater than 0'),
  transactionDate: z.string().min(1, 'Date is required'),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

type TransactionFormValues = z.infer<typeof transactionSchema>

const TYPE_OPTIONS = Object.entries(INVENTORY_TRANSACTION_TYPE_LABELS) as [
  InventoryTransactionType,
  string,
][]

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

const TYPE_CONFIG: Record<InventoryTransactionType, { text: string; sign: string }> = {
  STOCK_IN: { text: 'text-green-700', sign: '+' },
  STOCK_OUT: { text: 'text-red-600', sign: '−' },
  ADJUSTMENT: { text: 'text-amber-600', sign: 'A→' },
}

interface InventoryTransactionHistoryProps {
  itemId: string
  /** Called after a transaction is recorded so the parent can refresh the item's stock. */
  onRecorded?: () => void
}

export function InventoryTransactionHistory({
  itemId,
  onRecorded,
}: InventoryTransactionHistoryProps) {
  const { transactions: rawTransactions, isLoading, error, refetch } =
    useInventoryTransactions(itemId)
  const [showForm, setShowForm] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: '',
      quantity: '',
      transactionDate: getTodayString(),
      reference: '',
      notes: '',
    },
  })

  async function onSubmit(data: TransactionFormValues) {
    setServerError(null)
    try {
      await inventoryRepository.recordTransaction(itemId, {
        type: data.type as InventoryTransactionType,
        quantity: Number(data.quantity),
        transactionDate: data.transactionDate,
        reference: data.reference || undefined,
        notes: data.notes || undefined,
      })
      reset({ type: '', quantity: '', transactionDate: getTodayString(), reference: '', notes: '' })
      setShowForm(false)
      refetch()
      onRecorded?.()
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Failed to record transaction.')
    }
  }

  const transactions = [...rawTransactions].sort((a, b) =>
    a.transactionDate < b.transactionDate ? 1 : -1,
  )

  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
        <h2 className="text-sm font-semibold text-zinc-900">
          Transaction History
          {!isLoading && (
            <span className="ml-2 text-xs font-normal text-zinc-400">({transactions.length})</span>
          )}
        </h2>
        <button
          type="button"
          onClick={() => {
            setShowForm((v) => !v)
            setServerError(null)
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Record Transaction
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          aria-label="Record inventory transaction form"
          className="border-b border-zinc-200 bg-zinc-50 px-6 py-5"
        >
          {serverError && (
            <div
              className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
              role="alert"
            >
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              {serverError}
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="txn-type" className="block text-sm font-medium text-zinc-700">
                Type <span className="ml-0.5 text-red-500">*</span>
              </label>
              <div className="mt-1">
                <FormSelect id="txn-type" error={!!errors.type} {...register('type')}>
                  <option value="">Select type</option>
                  {TYPE_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </FormSelect>
              </div>
              {errors.type && (
                <p className="mt-1 text-xs text-red-600" role="alert">
                  {errors.type.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="txn-quantity" className="block text-sm font-medium text-zinc-700">
                Quantity <span className="ml-0.5 text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  id="txn-quantity"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="e.g. 10"
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2',
                    errors.quantity
                      ? 'border-red-300 bg-red-50 focus:ring-red-400'
                      : 'border-zinc-200 bg-white focus:ring-blue-500',
                  )}
                  {...register('quantity')}
                />
              </div>
              {errors.quantity && (
                <p className="mt-1 text-xs text-red-600" role="alert">
                  {errors.quantity.message}
                </p>
              )}
              <p className="mt-1 text-xs text-zinc-400">
                For Adjustment, quantity sets the new absolute stock level.
              </p>
            </div>

            <div>
              <label htmlFor="txn-date" className="block text-sm font-medium text-zinc-700">
                Date <span className="ml-0.5 text-red-500">*</span>
              </label>
              <div className="mt-1">
                <Controller
                  name="transactionDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      error={!!errors.transactionDate}
                    />
                  )}
                />
              </div>
              {errors.transactionDate && (
                <p className="mt-1 text-xs text-red-600" role="alert">
                  {errors.transactionDate.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="txn-reference" className="block text-sm font-medium text-zinc-700">
                Reference
              </label>
              <div className="mt-1">
                <input
                  id="txn-reference"
                  type="text"
                  placeholder="e.g. PO-123"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('reference')}
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="txn-notes" className="block text-sm font-medium text-zinc-700">
                Notes
              </label>
              <div className="mt-1">
                <textarea
                  id="txn-notes"
                  rows={2}
                  placeholder="Optional notes"
                  className="w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('notes')}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Recording…' : 'Record'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="space-y-3 px-6 py-6" aria-label="Loading transactions">
          {[0, 1].map((row) => (
            <div key={row} className="h-8 animate-pulse rounded bg-zinc-100" />
          ))}
        </div>
      ) : error ? (
        <div className="px-6 py-8 text-center">
          <p className="text-sm font-medium text-zinc-700">Failed to load transactions</p>
          <p className="mt-1 text-xs text-zinc-500">{error.message}</p>
          <button
            type="button"
            onClick={refetch}
            className="mt-4 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Retry
          </button>
        </div>
      ) : transactions.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm font-medium text-zinc-500">No transactions recorded</p>
          <p className="mt-1 text-xs text-zinc-400">Stock movements will appear here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-zinc-500">
                  Date
                </th>
                <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-zinc-500">
                  Type
                </th>
                <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-zinc-500">
                  Quantity
                </th>
                <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-zinc-500">
                  Reference
                </th>
                <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-zinc-500">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {transactions.map((txn) => {
                const config = TYPE_CONFIG[txn.type]
                const absQty = Math.abs(txn.quantity)
                return (
                  <tr key={txn.id} className="hover:bg-zinc-50">
                    <td className="px-5 py-3 text-zinc-600">
                      {formatLocalDate(txn.transactionDate)}
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn('text-xs font-medium', config.text)}>
                        {INVENTORY_TRANSACTION_TYPE_LABELS[txn.type]}
                      </span>
                    </td>
                    <td
                      className={cn('px-5 py-3 text-right font-medium tabular-nums', config.text)}
                    >
                      {config.sign}
                      {absQty}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-zinc-500">
                      {txn.reference ?? <span className="text-zinc-300">—</span>}
                    </td>
                    <td className="max-w-xs px-5 py-3 text-zinc-500">
                      {txn.notes ? (
                        <span className="truncate">{txn.notes}</span>
                      ) : (
                        <span className="text-zinc-300">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
