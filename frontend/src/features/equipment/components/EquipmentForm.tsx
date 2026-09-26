import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { equipmentCategoriesMockData } from '../data/equipment-categories.mock'
import { equipmentSchema, type EquipmentFormValues } from '../schemas/equipment.schema'
import { EQUIPMENT_STATUS_LABELS } from '../types/equipment.types'
import type { EquipmentStatus } from '../types/equipment.types'

const activeCategories = equipmentCategoriesMockData.filter((c) => c.status === 'ACTIVE')
const statusOptions = Object.entries(EQUIPMENT_STATUS_LABELS) as [EquipmentStatus, string][]

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

interface EquipmentFormProps {
  mode: 'create' | 'edit'
  defaultValues?: Partial<EquipmentFormValues>
  onCancel: () => void
}

export function EquipmentForm({ mode, defaultValues, onCancel }: EquipmentFormProps) {
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
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

  function onSubmit(data: EquipmentFormValues) {
    console.log(`[EquipmentForm:${mode}] values:`, data)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-6 py-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" aria-hidden="true" />
        <h3 className="mt-3 text-base font-semibold text-green-800">
          {mode === 'create' ? 'Equipment added successfully' : 'Equipment updated successfully'}
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
            to="/equipment"
            className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
          >
            Back to Equipment
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label={mode === 'create' ? 'Add equipment form' : 'Edit equipment form'}
    >
      <div className="space-y-5">
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

            <Field label="Status" required htmlFor="status" error={errors.status?.message}>
              <select
                id="status"
                className={inputCls(!!errors.status)}
                {...register('status')}
              >
                {statusOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
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
              <input
                id="purchaseDate"
                type="date"
                className={inputCls(!!errors.purchaseDate)}
                {...register('purchaseDate')}
              />
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
            disabled={isSubmitting}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mode === 'create' ? 'Add Equipment' : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  )
}
