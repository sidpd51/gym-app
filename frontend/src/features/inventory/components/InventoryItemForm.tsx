import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { FormSelect } from '@/components/common/FormSelect'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ApiError } from '@/lib/api'
import { inventoryRepository } from '../api/inventory.repository'
import { useInventoryCategories } from '../hooks/useInventory'
import { inventoryItemSchema, type InventoryItemFormValues } from '../schemas/inventory.schema'

const UNIT_SUGGESTIONS = ['pcs', 'kg', 'litre', 'box', 'pack', 'bottle', 'roll', 'set']

function inputCls(hasError: boolean) {
  return cn(
    'w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60',
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
  /** Required in edit mode (PATCH /api/v1/inventory/{id}). */
  itemId?: string
  defaultValues?: Partial<InventoryItemFormValues>
  onCancel: () => void
  successRedirectTo?: string
}

export function InventoryItemForm({
  mode,
  itemId,
  defaultValues,
  onCancel,
  successRedirectTo = '/inventory',
}: InventoryItemFormProps) {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const { categories, isLoading: categoriesLoading } = useInventoryCategories()
  const activeCategories = categories.filter((c) => c.status === 'ACTIVE')

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

  async function onSubmit(data: InventoryItemFormValues) {
    setServerError(null)
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
    try {
      if (mode === 'create') {
        await inventoryRepository.create({
          name: data.name,
          categoryId: data.categoryId,
          unit: data.unit,
          currentStock: Number(data.currentStock),
          minimumStock: Number(data.minimumStock),
          description: data.description || undefined,
        })
      } else {
        if (!itemId) {
          setServerError('Missing item id.')
          return
        }
        // Backend ItemUpdate: no categoryId/currentStock — stock changes via transactions only.
        await inventoryRepository.update(itemId, {
          name: data.name,
          unit: data.unit,
          minimumStock: Number(data.minimumStock),
          description: data.description || undefined,
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
      aria-label={mode === 'create' ? 'Add inventory item form' : 'Edit inventory item form'}
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

        <SectionCard title="Item Information">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Item Name" required htmlFor="name" error={errors.name?.message}>
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
                <FormSelect
                  id="categoryId"
                  error={!!errors.categoryId}
                  disabled={mode === 'edit' || categoriesLoading}
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
                {mode === 'edit' && (
                  <p className="mt-1 text-xs text-zinc-400">Category cannot be changed.</p>
                )}
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
                  step={1}
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
                step={1}
                placeholder="0"
                className={inputCls(!!errors.minimumStock)}
                {...register('minimumStock')}
              />
            </Field>

            {mode === 'edit' && (
              <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3 sm:col-span-2">
                <p className="text-xs text-zinc-500">
                  <span className="font-medium text-zinc-700">
                    Current stock cannot be edited here.
                  </span>{' '}
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
            disabled={isSubmitting || categoriesLoading}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? mode === 'create'
                ? 'Adding…'
                : 'Saving…'
              : mode === 'create'
                ? 'Add Item'
                : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  )
}
