import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useTrainer } from './hooks/useTrainers'
import { TrainerAvatar } from './components/TrainerAvatar'
import { TrainerStatusBadge } from './components/TrainerStatusBadge'
import type { TrainerStatus } from './types/trainer.types'

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
  const { trainer } = useTrainer(trainerId)

  const [statusOverride, setStatusOverride] = useState<TrainerStatus | null>(null)
  const effectiveStatus: TrainerStatus = statusOverride ?? trainer?.status ?? 'INACTIVE'

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

  function handleToggleStatus() {
    const next: TrainerStatus = effectiveStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    setStatusOverride(next)
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
                <TrainerStatusBadge status={effectiveStatus} />
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleToggleStatus}
              className={
                effectiveStatus === 'ACTIVE'
                  ? 'rounded-lg px-3 py-2 text-sm font-medium text-amber-600 ring-1 ring-inset ring-amber-300 hover:bg-amber-50'
                  : 'rounded-lg px-3 py-2 text-sm font-medium text-green-600 ring-1 ring-inset ring-green-300 hover:bg-green-50'
              }
            >
              {effectiveStatus === 'ACTIVE' ? 'Deactivate' : 'Activate'}
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
