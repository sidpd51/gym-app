import { useForm } from 'react-hook-form'
import { FormSelect } from '@/components/common/FormSelect'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTrainers } from '../../trainers/hooks/useTrainers'
import { memberTrainerRepository } from '../api/member-trainer.repository'
import { assignTrainerSchema, type AssignTrainerFormValues } from '../schemas/member-trainer.schema'
import { ApiError } from '@/lib/api'

function getTodayString(): string {
  const d = new Date()
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${day}`
}

interface TrainerAssignmentFormProps {
  memberId: string
  activeTrainerId: string | null
  onCancel: () => void
  onSuccess: (trainerId: string) => void
}

/**
 * Backend POST /api/v1/members/{memberId}/trainer accepts only
 * trainerId; startDate is set server-side (today). The old mock
 * form's startDate field is therefore not sent.
 */
export function TrainerAssignmentForm({
  memberId,
  activeTrainerId,
  onCancel,
  onSuccess,
}: TrainerAssignmentFormProps) {
  const { trainers, isLoading: trainersLoading } = useTrainers()
  const activeTrainers = trainers.filter((t) => t.status === 'ACTIVE')
  const mode = activeTrainerId ? 'change' : 'assign'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AssignTrainerFormValues>({
    resolver: zodResolver(assignTrainerSchema),
    defaultValues: {
      trainerId: '',
      startDate: getTodayString(),
    },
  })

  async function onSubmit(data: AssignTrainerFormValues) {
    try {
      await memberTrainerRepository.assign(memberId, data.trainerId)
      onSuccess(data.trainerId)
    } catch (err) {
      // Surface business-rule errors (e.g. trainer not found) via the
      // form's error display through window alert as a fallback.
      if (err instanceof ApiError) {
        window.alert(err.message)
      } else {
        window.alert('Failed to assign trainer. Please try again.')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="space-y-4">
        {/* Trainer select */}
        <div>
          <label htmlFor="trainerId" className="block text-sm font-medium text-zinc-700">
            Trainer <span className="text-red-500">*</span>
          </label>
          <div className="mt-1">
            <FormSelect
              id="trainerId"
              error={!!errors.trainerId}
              disabled={trainersLoading}
              {...register('trainerId')}
            >
              <option value="">
                {trainersLoading ? 'Loading trainers…' : 'Select a trainer'}
              </option>
              {activeTrainers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.firstName} {t.lastName}
                  {t.specialization ? ` — ${t.specialization}` : ''}
                </option>
              ))}
            </FormSelect>
          </div>
          {errors.trainerId && (
            <p className="mt-1 text-xs text-red-600" role="alert">
              {errors.trainerId.message}
            </p>
          )}
          <p className="mt-1 text-xs text-zinc-500">
            Start date is set to today by the server.
          </p>
        </div>

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
            disabled={isSubmitting || trainersLoading}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Saving…' : mode === 'assign' ? 'Assign Trainer' : 'Change Trainer'}
          </button>
        </div>
      </div>
    </form>
  )
}
