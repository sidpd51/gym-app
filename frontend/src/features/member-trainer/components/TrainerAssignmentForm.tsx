import { useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { DatePicker } from '@/components/common/DatePicker'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTrainers } from '../../trainers/hooks/useTrainers'
import { assignTrainerSchema, type AssignTrainerFormValues } from '../schemas/member-trainer.schema'

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

interface TrainerAssignmentFormProps {
  activeTrainerId: string | null
  onSubmit: (data: AssignTrainerFormValues) => void
  onCancel: () => void
}

export function TrainerAssignmentForm({
  activeTrainerId,
  onSubmit,
  onCancel,
}: TrainerAssignmentFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AssignTrainerFormValues>({
    resolver: zodResolver(assignTrainerSchema),
    defaultValues: {
      trainerId: '',
      startDate: getTodayString(),
    },
  })

  const { trainers } = useTrainers()
  const selectedTrainerId = watch('trainerId')

  const isDuplicate = useMemo(
    () => !!activeTrainerId && selectedTrainerId === activeTrainerId,
    [activeTrainerId, selectedTrainerId],
  )

  const activeTrainers = trainers.filter((t) => t.status === 'ACTIVE')
  const mode = activeTrainerId ? 'change' : 'assign'

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="space-y-4">
        {/* Trainer select */}
        <div>
          <label htmlFor="trainerId" className="block text-sm font-medium text-zinc-700">
            Trainer <span className="text-red-500">*</span>
          </label>
          <div className="mt-1">
            <select
              id="trainerId"
              className={inputCls(!!errors.trainerId)}
              {...register('trainerId')}
            >
              <option value="">Select a trainer…</option>
              {activeTrainers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.firstName} {t.lastName}
                  {t.specialization ? ` — ${t.specialization}` : ''}
                </option>
              ))}
            </select>
          </div>
          {errors.trainerId && (
            <p className="mt-1 text-xs text-red-600" role="alert">
              {errors.trainerId.message}
            </p>
          )}
        </div>

        {/* Start date */}
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-zinc-700">
            Start Date <span className="text-red-500">*</span>
          </label>
          <div className="mt-1">
            <Controller
              name="startDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  error={!!errors.startDate}
                />
              )}
            />
          </div>
          {errors.startDate && (
            <p className="mt-1 text-xs text-red-600" role="alert">
              {errors.startDate.message}
            </p>
          )}
        </div>

        {/* Duplicate warning */}
        {isDuplicate && (
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p className="text-sm text-amber-700">
              This trainer is already assigned to this member.
            </p>
          </div>
        )}

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
            disabled={isSubmitting || isDuplicate}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mode === 'assign' ? 'Assign Trainer' : 'Change Trainer'}
          </button>
        </div>
      </div>
    </form>
  )
}
