import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useTrainer } from './hooks/useTrainers'
import { trainerRepository } from './api/trainers.repository'
import { TrainerAvatar } from './components/TrainerAvatar'
import { TrainerStatusBadge } from './components/TrainerStatusBadge'
import type { TrainerStatus } from './types/trainer.types'
import { ApiError } from '@/lib/api'

function formatLocalDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

interface DetailRowProps {
  label: string
  value: React.ReactNode
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-zinc-900">{value}</p>
    </div>
  )
}

export function TrainerDetailsPage() {
  const { trainerId } = useParams<{ trainerId: string }>()
  const { trainer, isLoading, error, refetch } = useTrainer(trainerId)
  const [toggling, setToggling] = useState(false)
  const [toggleError, setToggleError] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-5" aria-label="Loading trainer">
        <div className="h-4 w-32 animate-pulse rounded bg-zinc-100" />
        <div className="h-24 animate-pulse rounded-lg bg-zinc-100" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="h-40 animate-pulse rounded-lg bg-zinc-100" />
          <div className="h-40 animate-pulse rounded-lg bg-zinc-100" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-base font-semibold text-zinc-700">Failed to load trainer</h2>
        <p className="mt-1 text-sm text-zinc-500">{error.message}</p>
        <button
          type="button"
          onClick={refetch}
          className="mt-6 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!trainer) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-4xl font-bold text-zinc-200">Not Found</p>
        <h2 className="mt-3 text-base font-semibold text-zinc-700">Trainer not found</h2>
        <p className="mt-1 text-sm text-zinc-500">
          No trainer with ID{' '}
          <span className="font-mono font-medium text-zinc-700">{trainerId}</span> exists.
        </p>
        <Link
          to="/trainers"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Trainers
        </Link>
      </div>
    )
  }

  async function handleToggleStatus(currentTrainer: NonNullable<typeof trainer>) {
    setToggleError(null)
    setToggling(true)
    try {
      const next: TrainerStatus = currentTrainer.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
      await trainerRepository.update(currentTrainer.id, { status: next })
      refetch()
    } catch (err) {
      setToggleError(err instanceof ApiError ? err.message : 'Failed to update status.')
    } finally {
      setToggling(false)
    }
  }

  return (
    <div className="space-y-5">
      <Link
        to="/trainers"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Trainers
      </Link>

      {toggleError && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700"
          role="alert"
        >
          {toggleError}
        </div>
      )}

      {/* Header */}
      <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <TrainerAvatar
              firstName={trainer.firstName}
              lastName={trainer.lastName}
              size="lg"
            />
            <div>
              <h1 className="text-xl font-semibold text-zinc-900">
                {trainer.firstName} {trainer.lastName}
              </h1>
              <p className="mt-0.5 font-mono text-sm text-zinc-500">{trainer.trainerCode}</p>
              <div className="mt-1.5">
                <TrainerStatusBadge status={trainer.status} />
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => trainer && handleToggleStatus(trainer)}
              disabled={toggling}
              className={
                trainer.status === 'ACTIVE'
                  ? 'rounded-lg px-3 py-2 text-sm font-medium text-amber-600 ring-1 ring-inset ring-amber-300 hover:bg-amber-50 disabled:opacity-50'
                  : 'rounded-lg px-3 py-2 text-sm font-medium text-green-600 ring-1 ring-inset ring-green-300 hover:bg-green-50 disabled:opacity-50'
              }
            >
              {toggling ? 'Saving…' : trainer.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
            </button>
            <Link
              to={`/trainers/${trainer.id}/edit`}
              className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Edit Trainer
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Contact Information */}
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
          <h2 className="text-sm font-semibold text-zinc-900">Contact Information</h2>
          <div className="mt-4 space-y-4">
            <DetailRow label="Phone" value={trainer.phone} />
            <DetailRow
              label="Email"
              value={trainer.email ?? <span className="text-zinc-400">Not provided</span>}
            />
          </div>
        </div>

        {/* Professional Information */}
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
          <h2 className="text-sm font-semibold text-zinc-900">Professional Information</h2>
          <div className="mt-4 space-y-4">
            <DetailRow
              label="Specialization"
              value={trainer.specialization ?? <span className="text-zinc-400">Not specified</span>}
            />
            <DetailRow label="Joining Date" value={formatLocalDate(trainer.joiningDate)} />
          </div>
        </div>
      </div>
    </div>
  )
}
