import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  equipmentMaintenanceSchema,
  type EquipmentMaintenanceFormValues,
} from '../schemas/equipment-maintenance.schema'
import { MAINTENANCE_TYPE_LABELS } from '../types/equipment.types'
import type { MaintenanceType } from '../types/equipment.types'

const maintenanceTypeOptions = Object.entries(MAINTENANCE_TYPE_LABELS) as [MaintenanceType, string][]

function getTodayString(): string {
  const d = new Date()
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${day}`
}

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

interface MaintenanceFormProps {
  equipmentId: string
  onCancel: () => void
}

export function MaintenanceForm({ equipmentId, onCancel }: MaintenanceFormProps) {
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EquipmentMaintenanceFormValues>({
    resolver: zodResolver(equipmentMaintenanceSchema),
    defaultValues: {
      maintenanceDate: getTodayString(),
      maintenanceType: '',
      description: '',
      cost: '',
      performedBy: '',
      nextMaintenanceDate: '',
      notes: '',
    },
  })

  function onSubmit(data: EquipmentMaintenanceFormValues) {
    console.log('[MaintenanceForm] values:', data)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-6 py-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" aria-hidden="true" />
        <h3 className="mt-3 text-base font-semibold text-green-800">
          Maintenance record added successfully
        </h3>
        <p className="mt-1 text-sm text-green-700">
          Backend integration will be added in a later phase. Changes have not been persisted.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="rounded-lg border border-green-300 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
          >
            Add Another
          </button>
          <Link
            to={`/equipment/${equipmentId}`}
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
      aria-label="Record maintenance form"
    >
      <div className="space-y-5">
        {/* Maintenance Details */}
        <SectionCard title="Maintenance Details">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Maintenance Date"
              required
              htmlFor="maintenanceDate"
              error={errors.maintenanceDate?.message}
            >
              <input
                id="maintenanceDate"
                type="date"
                className={inputCls(!!errors.maintenanceDate)}
                {...register('maintenanceDate')}
              />
            </Field>

            <Field
              label="Maintenance Type"
              required
              htmlFor="maintenanceType"
              error={errors.maintenanceType?.message}
            >
              <select
                id="maintenanceType"
                className={inputCls(!!errors.maintenanceType)}
                {...register('maintenanceType')}
              >
                <option value="">Select type…</option>
                {maintenanceTypeOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>

            <div className="sm:col-span-2">
              <Field
                label="Description"
                required
                htmlFor="description"
                error={errors.description?.message}
              >
                <textarea
                  id="description"
                  rows={3}
                  placeholder="Describe the maintenance performed…"
                  className={cn(inputCls(!!errors.description), 'resize-none')}
                  {...register('description')}
                />
              </Field>
            </div>

            <Field label="Performed By" htmlFor="performedBy" error={errors.performedBy?.message}>
              <input
                id="performedBy"
                type="text"
                placeholder="e.g. FitZone Equipment Services"
                className={inputCls(!!errors.performedBy)}
                {...register('performedBy')}
              />
            </Field>
          </div>
        </SectionCard>

        {/* Additional Details */}
        <SectionCard title="Additional Details">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Cost" htmlFor="cost" error={errors.cost?.message}>
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-sm text-zinc-500">₹</span>
                <input
                  id="cost"
                  type="number"
                  min={0}
                  step={1}
                  placeholder="0"
                  className={inputCls(!!errors.cost)}
                  {...register('cost')}
                />
              </div>
            </Field>

            <Field
              label="Next Maintenance Date"
              htmlFor="nextMaintenanceDate"
              error={errors.nextMaintenanceDate?.message}
            >
              <input
                id="nextMaintenanceDate"
                type="date"
                className={inputCls(!!errors.nextMaintenanceDate)}
                {...register('nextMaintenanceDate')}
              />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Notes" htmlFor="notes" error={errors.notes?.message}>
                <textarea
                  id="notes"
                  rows={3}
                  placeholder="Any additional notes…"
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
            Save Record
          </button>
        </div>
      </div>
    </form>
  )
}
