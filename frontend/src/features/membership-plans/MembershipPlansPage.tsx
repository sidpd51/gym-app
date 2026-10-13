import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import type { MembershipPlanStatus } from './types/membership-plan.types'
import { useMembershipPlans } from './hooks/useMembershipPlans'
import { membershipPlanRepository } from './api/membership-plans.repository'
import { MembershipPlanFilters } from './components/MembershipPlanFilters'
import { MembershipPlanTable } from './components/MembershipPlanTable'
import { PermissionGate } from '@/features/auth/components/PermissionGate'

type StatusFilter = MembershipPlanStatus | 'ALL'

export function MembershipPlansPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [toggleError, setToggleError] = useState<string | null>(null)

  const { plans, meta, isLoading, error, refetch } = useMembershipPlans({
    page: 1,
    pageSize: 100,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  })

  async function handleToggleStatus(planId: string, current: MembershipPlanStatus) {
    setToggleError(null)
    setTogglingId(planId)
    try {
      await membershipPlanRepository.update(planId, {
        status: current === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
      })
      refetch()
    } catch (err) {
      setToggleError(err instanceof Error ? err.message : 'Failed to update status.')
    } finally {
      setTogglingId(null)
    }
  }

  function handleSearchChange(value: string) {
    setSearch(value)
  }

  function handleStatusChange(value: StatusFilter) {
    setStatusFilter(value)
  }

  const filteredPlans = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return plans
    return plans.filter((plan) => {
      const searchable = `${plan.name} ${plan.description ?? ''}`.toLowerCase()
      return searchable.includes(q)
    })
  }, [search, plans])

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
            {isLoading ? (
              'Loading plans…'
            ) : (
              <>
                All Plans
                <span className="ml-2 text-xs font-normal text-zinc-400">
                  {filteredPlans.length} of {meta?.total ?? plans.length}
                </span>
              </>
            )}
          </h3>
        </div>
        {isLoading ? (
          <div className="space-y-3 px-5 py-6" aria-label="Loading plans">
            {[0, 1, 2].map((row) => (
              <div key={row} className="h-10 animate-pulse rounded-lg bg-zinc-100" />
            ))}
          </div>
        ) : error ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-medium text-zinc-700">Failed to load plans</p>
            <p className="mt-1 text-xs text-zinc-500">{error.message}</p>
            <button
              type="button"
              onClick={refetch}
              className="mt-4 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Retry
            </button>
          </div>
        ) : (
          <MembershipPlanTable
            plans={filteredPlans}
            pendingPlanId={togglingId}
            onToggleStatus={handleToggleStatus}
          />
        )}
      </div>
    </div>
  )
}
