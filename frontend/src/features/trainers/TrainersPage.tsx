import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useTrainers } from './hooks/useTrainers'
import { trainerRepository } from './api/trainers.repository'
import { TrainerFilters } from './components/TrainerFilters'
import { TrainerTable } from './components/TrainerTable'
import type { TrainerStatus } from './types/trainer.types'
import { PermissionGate } from '@/features/auth/components/PermissionGate'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useToast } from '@/components/common/Toast'
import { ApiError } from '@/lib/api'

type StatusFilter = TrainerStatus | 'ALL'

interface PendingToggle {
  trainerId: string
  current: TrainerStatus
  name: string
}

export function TrainersPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [pendingToggle, setPendingToggle] = useState<PendingToggle | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [toggleError, setToggleError] = useState<string | null>(null)
  const { showToast } = useToast()

  const { trainers, meta, isLoading, error, refetch } = useTrainers({
    page: 1,
    pageSize: 100,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  })

  async function applyToggle(trainerId: string, current: TrainerStatus) {
    setToggleError(null)
    setTogglingId(trainerId)
    try {
      const next: TrainerStatus = current === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
      await trainerRepository.update(trainerId, { status: next })
      showToast(
        next === 'INACTIVE'
          ? 'Trainer deactivated successfully.'
          : 'Trainer activated successfully.',
      )
      refetch()
    } catch (err) {
      setToggleError(err instanceof ApiError ? err.message : 'Failed to update status.')
    } finally {
      setTogglingId(null)
    }
  }

  function handleToggleStatus(trainerId: string, current: TrainerStatus) {
    if (current === 'ACTIVE') {
      const trainer = trainers.find((t) => t.id === trainerId)
      const name = trainer ? `${trainer.firstName} ${trainer.lastName}` : 'this trainer'
      setPendingToggle({ trainerId, current, name })
    } else {
      applyToggle(trainerId, current)
    }
  }

  function handleConfirmDeactivate() {
    if (!pendingToggle) return
    applyToggle(pendingToggle.trainerId, pendingToggle.current)
    setPendingToggle(null)
  }

  const filteredTrainers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return trainers.filter((t) => {
      if (q) {
        const fullName = `${t.firstName} ${t.lastName}`.toLowerCase()
        const code = t.trainerCode.toLowerCase()
        const phone = t.phone
        const spec = (t.specialization ?? '').toLowerCase()
        if (!fullName.includes(q) && !code.includes(q) && !phone.includes(q) && !spec.includes(q)) {
          return false
        }
      }
      return true
    })
  }, [search, trainers])

  if (isLoading) {
    return (
      <div className="space-y-5" aria-label="Loading trainers">
        <div className="h-6 w-48 animate-pulse rounded bg-zinc-100" />
        <div className="h-12 animate-pulse rounded-lg bg-zinc-100" />
        <div className="space-y-3 px-5 py-6">
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="h-10 animate-pulse rounded-lg bg-zinc-100" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Trainers</h2>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-5 py-12 text-center">
          <p className="text-sm font-medium text-zinc-700">Failed to load trainers</p>
          <p className="mt-1 text-xs text-zinc-500">{error.message}</p>
          <button
            type="button"
            onClick={refetch}
            className="mt-4 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Trainers</h2>
          <p className="mt-0.5 text-sm text-zinc-500">
            {meta?.total ?? trainers.length} trainer{(meta?.total ?? trainers.length) !== 1 ? 's' : ''}
          </p>
        </div>
        <PermissionGate permission="trainers:create">
          <Link
            to="/trainers/new"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Trainer
          </Link>
        </PermissionGate>
      </div>

      <TrainerFilters
        search={search}
        statusFilter={statusFilter}
        onSearchChange={setSearch}
        onStatusChange={setStatusFilter}
      />

      {toggleError && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700"
          role="alert"
        >
          {toggleError}
        </div>
      )}

      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h3 className="text-sm font-semibold text-zinc-900">
            {filteredTrainers.length} trainer{filteredTrainers.length !== 1 ? 's' : ''}
          </h3>
        </div>
        <TrainerTable
          trainers={filteredTrainers}
          pendingTrainerId={togglingId}
          onToggleStatus={handleToggleStatus}
        />
      </div>

      <ConfirmDialog
        open={pendingToggle !== null}
        title="Deactivate trainer?"
        message={`${pendingToggle?.name ?? 'This trainer'} will be marked as inactive and will no longer appear as available. You can reactivate them at any time.`}
        confirmLabel="Deactivate"
        variant="danger"
        onConfirm={handleConfirmDeactivate}
        onCancel={() => setPendingToggle(null)}
      />
    </div>
  )
}
