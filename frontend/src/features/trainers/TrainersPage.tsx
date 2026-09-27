import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { trainersMockData } from './data/trainers.mock'
import { TrainerFilters } from './components/TrainerFilters'
import { TrainerTable } from './components/TrainerTable'
import type { TrainerStatus } from './types/trainer.types'
import { PermissionGate } from '@/features/auth/components/PermissionGate'

type StatusFilter = TrainerStatus | 'ALL'

export function TrainersPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [statusOverrides, setStatusOverrides] = useState<Record<string, TrainerStatus>>({})

  function effectiveStatus(trainerId: string): TrainerStatus {
    return statusOverrides[trainerId] ?? (trainersMockData.find((t) => t.id === trainerId)?.status ?? 'INACTIVE')
  }

  function handleToggleStatus(trainerId: string, current: TrainerStatus) {
    const next: TrainerStatus = current === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    setStatusOverrides((prev) => ({ ...prev, [trainerId]: next }))
  }

  const filteredTrainers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return trainersMockData.filter((t) => {
      const status = statusOverrides[t.id] ?? t.status
      if (statusFilter !== 'ALL' && status !== statusFilter) return false
      if (q) {
        const fullName = `${t.firstName} ${t.lastName}`.toLowerCase()
        const code = t.trainerCode.toLowerCase()
        const phone = t.phone
        const spec = (t.specialization ?? '').toLowerCase()
        if (
          !fullName.includes(q) &&
          !code.includes(q) &&
          !phone.includes(q) &&
          !spec.includes(q)
        ) {
          return false
        }
      }
      return true
    })
  }, [search, statusFilter, statusOverrides])

  function handleSearchChange(value: string) {
    setSearch(value)
  }

  function handleStatusChange(value: StatusFilter) {
    setStatusFilter(value)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Trainers</h2>
          <p className="mt-0.5 text-sm text-zinc-500">
            Manage gym trainers and staff.
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
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
      />

      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h3 className="text-sm font-semibold text-zinc-900">
            {filteredTrainers.length} trainer{filteredTrainers.length !== 1 ? 's' : ''}
          </h3>
        </div>
        <TrainerTable
          trainers={filteredTrainers}
          effectiveStatus={effectiveStatus}
          onToggleStatus={handleToggleStatus}
        />
      </div>
    </div>
  )
}
