import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { DatePicker } from '@/components/common/DatePicker'
import { FormSelect } from '@/components/common/FormSelect'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ApiError } from '@/lib/api'
import { equipmentRepository } from '../api/equipment.repository'
import { useEquipmentCategories } from '../hooks/useEquipment'
import { equipmentSchema, type EquipmentFormValues } from '../schemas/equipment.schema'
import { EQUIPMENT_STATUS_LABELS } from '../types/equipment.types'
import type { EquipmentStatus } from '../types/equipment.types'

const statusOptions = Object.entries(EQUIPMENT_STATUS_LABELS) as [EquipmentStatus, string][]

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

interface EquipmentFormProps {
  mode: 'create' | 'edit'
  /** Required in edit mode (PATCH /api/v1/equipment/{id}). */
  equipmentId?: string
  defaultValues?: Partial<EquipmentFormValues>
  onCancel: () => void
  successRedirectTo?: string
}

export function EquipmentForm({
  mode,
  equipmentId,
  defaultValues,
  onCancel,
  successRedirectTo = '/equipment',
}: EquipmentFormProps) {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const { categories, isLoading: categoriesLoading } = useEquipmentCategories()
  const activeCategories = categories.filter((c) => c.status === 'ACTIVE')

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      name: '',
      categoryId: '',
      brand: '',
      model: '',
      serialNumber: '',
      purchaseDate: '',
      purchaseCost: '',
      location: '',
      status: 'ACTIVE',
      notes: '',
      ...defaultValues,
    },
  })

  async function onSubmit(data: EquipmentFormValues) {
    setServerError(null)
    try {
      if (mode === 'create') {
        await equipmentRepository.create({
          name: data.name,
          categoryId: data.categoryId,
          brand: data.brand || undefined,
          model: data.model || undefined,
          serialNumber: data.serialNumber || undefined,
          purchaseDate: data.purchaseDate || undefined,
          purchaseCost: data.purchaseCost ? Number(data.purchaseCost) : undefined,
          location: data.location || undefined,
          status: data.status as EquipmentStatus,
          notes: data.notes || undefined,
        })
      } else {
        if (!equipmentId) {
          setServerError('Missing equipment id.')
          return
        }
        // Backend EquipmentUpdate: no categoryId/purchaseDate/purchaseCost.
        await equipmentRepository.update(equipmentId, {
          name: data.name,
          brand: data.brand || undefined,
          model: data.model || undefined,
          serialNumber: data.serialNumber || undefined,
          location: data.location || undefined,
          status: data.status as EquipmentStatus,
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
      aria-label={mode === 'create' ? 'Add equipment form' : 'Edit equipment form'}
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

        {/* Equipment Information */}
        <SectionCard title="Equipment Information">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Equipment Name" required htmlFor="name" error={errors.name?.message}>
                <input
                  id="name"
                  type="text"
                  placeholder="e.g. Treadmill"
                  className={inputCls(!!errors.name)}
                  {...register('name')}
                />
              </Field>
            </div>

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

            <Field label="Status" required htmlFor="status" error={errors.status?.message}>
              <FormSelect id="status" error={!!errors.status} {...register('status')}>
                {statusOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </FormSelect>
            </Field>

            <div className="sm:col-span-2">
              <Field label="Location" htmlFor="location" error={errors.location?.message}>
                <input
                  id="location"
                  type="text"
                  placeholder="e.g. Ground Floor — Cardio Zone"
                  className={inputCls(!!errors.location)}
                  {...register('location')}
                />
              </Field>
            </div>
          </div>
        </SectionCard>

        {/* Specifications */}
        <SectionCard title="Specifications">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Brand" htmlFor="brand" error={errors.brand?.message}>
              <input
                id="brand"
                type="text"
                placeholder="e.g. TechnoGym"
                className={inputCls(!!errors.brand)}
                {...register('brand')}
              />
            </Field>

            <Field label="Model" htmlFor="model" error={errors.model?.message}>
              <input
                id="model"
                type="text"
                placeholder="e.g. Run 500"
                className={inputCls(!!errors.model)}
                {...register('model')}
              />
            </Field>

            <div className="sm:col-span-2">
              <Field
                label="Serial Number"
                htmlFor="serialNumber"
                error={errors.serialNumber?.message}
              >
                <input
                  id="serialNumber"
                  type="text"
                  placeholder="e.g. TG-RUN-500-001"
                  className={inputCls(!!errors.serialNumber)}
                  {...register('serialNumber')}
                />
              </Field>
            </div>
          </div>
        </SectionCard>

        {/* Purchase Information */}
        <SectionCard title="Purchase Information">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Purchase Date"
              htmlFor="purchaseDate"
              error={errors.purchaseDate?.message}
            >
              <Controller
                name="purchaseDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    error={!!errors.purchaseDate}
                  />
                )}
              />
              {mode === 'edit' && (
                <p className="mt-1 text-xs text-zinc-400">
                  Purchase details cannot be changed after creation.
                </p>
              )}
            </Field>

            <Field
              label="Purchase Cost"
              htmlFor="purchaseCost"
              error={errors.purchaseCost?.message}
            >
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-sm text-zinc-500">₹</span>
                <input
                  id="purchaseCost"
                  type="number"
                  min={0}
                  step={1}
                  placeholder="0"
                  disabled={mode === 'edit'}
                  className={inputCls(!!errors.purchaseCost)}
                  {...register('purchaseCost')}
                />
              </div>
            </Field>
          </div>
        </SectionCard>

        {/* Notes */}
        <SectionCard title="Notes">
          <Field label="Notes" htmlFor="notes" error={errors.notes?.message}>
            <textarea
              id="notes"
              rows={3}
              placeholder="Any additional notes about this equipment…"
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
            disabled={isSubmitting || categoriesLoading}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? mode === 'create'
                ? 'Adding…'
                : 'Saving…'
              : mode === 'create'
                ? 'Add Equipment'
                : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  )
}
