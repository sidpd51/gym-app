import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import type { MembershipPlanStatus } from './types/membership-plan.types'
import { useMembershipPlans } from './hooks/useMembershipPlans'
import { MembershipPlanFilters } from './components/MembershipPlanFilters'
import { MembershipPlanTable } from './components/MembershipPlanTable'
import { PermissionGate } from '@/features/auth/components/PermissionGate'

type StatusFilter = MembershipPlanStatus | 'ALL'

export function MembershipPlansPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [statusOverrides, setStatusOverrides] = useState<Record<string, MembershipPlanStatus>>({})

  const { plans } = useMembershipPlans()

  function effectiveStatus(planId: string): MembershipPlanStatus {
    return statusOverrides[planId] ?? plans.find((p) => p.id === planId)!.status
  }

  function handleToggleStatus(planId: string, current: MembershipPlanStatus) {
    setStatusOverrides((prev) => ({
      ...prev,
      [planId]: current === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
    }))
  }

  function handleSearchChange(value: string) {
    setSearch(value)
  }

  function handleStatusChange(value: StatusFilter) {
    setStatusFilter(value)
  }

  const filteredPlans = useMemo(() => {
    const q = search.trim().toLowerCase()
    return plans.filter((plan) => {
      const status = statusOverrides[plan.id] ?? plan.status
      if (statusFilter !== 'ALL' && status !== statusFilter) return false
      if (q) {
        const searchable = `${plan.name} ${plan.description ?? ''}`.toLowerCase()
        if (!searchable.includes(q)) return false
      }
      return true
    })
  }, [search, statusFilter, statusOverrides, plans])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Membership Plans</h2>
          <p className="mt-0.5 text-sm text-zinc-500">
            Manage the plans offered by your gym.
          </p>
        </div>
        <PermissionGate permission="membership-plans:create">
          <Link
            to="/membership-plans/new"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create Plan
          </Link>
        </PermissionGate>
      </div>

      <MembershipPlanFilters
        search={search}
        statusFilter={statusFilter}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
      />

      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h3 className="text-sm font-semibold text-zinc-900">
            All Plans
            <span className="ml-2 text-xs font-normal text-zinc-400">
              {filteredPlans.length} of {plans.length}
            </span>
          </h3>
        </div>
        <MembershipPlanTable
          plans={filteredPlans}
          effectiveStatus={effectiveStatus}
          onToggleStatus={handleToggleStatus}
        />
      </div>
    </div>
  )
}
