import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useInventoryCategories } from '../hooks/useInventory'
import { inventoryItemSchema, type InventoryItemFormValues } from '../schemas/inventory.schema'

const UNIT_SUGGESTIONS = ['pcs', 'kg', 'litre', 'box', 'pack', 'bottle', 'roll', 'set']

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
  hint?: string
  children: React.ReactNode
}

function Field({ label, required, error, htmlFor, hint, children }: FieldProps) {
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
      {hint && !error && <p className="mt-1 text-xs text-zinc-400">{hint}</p>}
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

interface InventoryItemFormProps {
  mode: 'create' | 'edit'
  defaultValues?: Partial<InventoryItemFormValues>
  onCancel: () => void
}

export function InventoryItemForm({ mode, defaultValues, onCancel }: InventoryItemFormProps) {
  const { categories } = useInventoryCategories()
  const activeCategories = categories.filter((c) => c.status === 'ACTIVE')
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<InventoryItemFormValues>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      name: '',
      categoryId: '',
      unit: '',
      currentStock: '',
      minimumStock: '',
      description: '',
      ...defaultValues,
    },
  })

  function onSubmit(data: InventoryItemFormValues) {
    if (mode === 'create') {
      const stock = data.currentStock ?? ''
      if (stock.trim() === '') {
        setError('currentStock', { message: 'Current stock is required' })
        return
      }
      if (isNaN(Number(stock)) || Number(stock) < 0) {
        setError('currentStock', { message: 'Enter a valid quantity (0 or more)' })
        return
      }
    }
    console.log(`[InventoryItemForm:${mode}] values:`, data)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-6 py-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" aria-hidden="true" />
        <h3 className="mt-3 text-base font-semibold text-green-800">
          {mode === 'create' ? 'Inventory item added successfully' : 'Inventory item updated successfully'}
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
            to="/inventory"
            className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
          >
            Back to Inventory
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label={mode === 'create' ? 'Add inventory item form' : 'Edit inventory item form'}
    >
      <div className="space-y-5">
        <SectionCard title="Item Information">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field
                label="Item Name"
                required
                htmlFor="name"
                error={errors.name?.message}
              >
                <input
                  id="name"
                  type="text"
                  placeholder="e.g. Whey Protein 1kg"
                  className={inputCls(!!errors.name)}
                  {...register('name')}
                />
              </Field>
            </div>

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

            <Field
              label="Unit"
              required
              htmlFor="unit"
              hint={`e.g. ${UNIT_SUGGESTIONS.join(', ')}`}
              error={errors.unit?.message}
            >
              <input
                id="unit"
                type="text"
                list="unit-suggestions"
                placeholder="e.g. pcs"
                className={inputCls(!!errors.unit)}
                {...register('unit')}
              />
              <datalist id="unit-suggestions">
                {UNIT_SUGGESTIONS.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </Field>

            <div className="sm:col-span-2">
              <Field
                label="Description"
                htmlFor="description"
                error={errors.description?.message}
              >
                <textarea
                  id="description"
                  rows={3}
                  placeholder="Optional item description…"
                  className={cn(inputCls(!!errors.description), 'resize-none')}
                  {...register('description')}
                />
              </Field>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Stock Information">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {mode === 'create' && (
              <Field
                label="Current Stock"
                required
                htmlFor="currentStock"
                hint="Opening quantity on hand"
                error={errors.currentStock?.message}
              >
                <input
                  id="currentStock"
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="0"
                  className={inputCls(!!errors.currentStock)}
                  {...register('currentStock')}
                />
              </Field>
            )}

            <Field
              label="Minimum Stock"
              required
              htmlFor="minimumStock"
              hint="Low-stock alert threshold"
              error={errors.minimumStock?.message}
            >
              <input
                id="minimumStock"
                type="number"
                min={0}
                step={0.01}
                placeholder="0"
                className={inputCls(!!errors.minimumStock)}
                {...register('minimumStock')}
              />
            </Field>

            {mode === 'edit' && (
              <div className="sm:col-span-2 rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3">
                <p className="text-xs text-zinc-500">
                  <span className="font-medium text-zinc-700">Current stock cannot be edited here.</span>{' '}
                  Stock levels are changed through inventory transactions.
                </p>
              </div>
            )}
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
            {mode === 'create' ? 'Add Item' : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  )
}
