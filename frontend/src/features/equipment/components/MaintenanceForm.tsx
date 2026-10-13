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
import {
  equipmentMaintenanceSchema,
  type EquipmentMaintenanceFormValues,
} from '../schemas/equipment-maintenance.schema'
import { MAINTENANCE_TYPE_LABELS } from '../types/equipment.types'
import type { MaintenanceType } from '../types/equipment.types'

const maintenanceTypeOptions = Object.entries(MAINTENANCE_TYPE_LABELS) as [
  MaintenanceType,
  string,
][]

function getTodayString(): string {
  const d = new Date()
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${day}`
}

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

interface MaintenanceFormProps {
  equipmentId: string
  onCancel: () => void
  successRedirectTo?: string
}

export function MaintenanceForm({
  equipmentId,
  onCancel,
  successRedirectTo,
}: MaintenanceFormProps) {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
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

  async function onSubmit(data: EquipmentMaintenanceFormValues) {
    setServerError(null)
    try {
      await equipmentRepository.recordMaintenance(equipmentId, {
        maintenanceDate: data.maintenanceDate,
        maintenanceType: data.maintenanceType as MaintenanceType,
        description: data.description,
        cost: data.cost ? Number(data.cost) : undefined,
        performedBy: data.performedBy || undefined,
        nextMaintenanceDate: data.nextMaintenanceDate || undefined,
        notes: data.notes || undefined,
      })
      navigate(successRedirectTo ?? `/equipment/${equipmentId}`)
    } catch (err) {
      if (err instanceof ApiError || err instanceof Error) {
        setServerError(err.message)
      } else {
        setServerError('Something went wrong. Please try again.')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Record maintenance form">
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

        {/* Maintenance Details */}
        <SectionCard title="Maintenance Details">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Maintenance Date"
              required
              htmlFor="maintenanceDate"
              error={errors.maintenanceDate?.message}
            >
              <Controller
                name="maintenanceDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    error={!!errors.maintenanceDate}
                  />
                )}
              />
            </Field>

            <Field
              label="Maintenance Type"
              required
              htmlFor="maintenanceType"
              error={errors.maintenanceType?.message}
            >
              <FormSelect
                id="maintenanceType"
                error={!!errors.maintenanceType}
                {...register('maintenanceType')}
              >
                <option value="">Select type</option>
                {maintenanceTypeOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </FormSelect>
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
              <Controller
                name="nextMaintenanceDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    error={!!errors.nextMaintenanceDate}
                  />
                )}
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
            {isSubmitting ? 'Saving…' : 'Save Record'}
          </button>
        </div>
      </div>
    </form>
  )
}
