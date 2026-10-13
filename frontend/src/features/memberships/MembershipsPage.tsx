import { useMemo, useState } from 'react'
import { useMembershipPlans } from '../membership-plans/hooks/useMembershipPlans'
import { useMembers } from '../members/hooks/useMembers'
import { MembershipFilters } from './components/MembershipFilters'
import { MembershipPagination } from './components/MembershipPagination'
import { MembershipTable } from './components/MembershipTable'
import { useMemberships } from './hooks/useMemberships'
import type { MembershipStatus } from './types/membership.types'

const PAGE_SIZE = 10

export function MembershipsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<MembershipStatus | 'ALL'>('ALL')
  const [planFilter, setPlanFilter] = useState('ALL')
  const [page, setPage] = useState(1)

  const { members, isLoading: membersLoading } = useMembers()
  const { plans, isLoading: plansLoading } = useMembershipPlans()
  const { memberships, meta, isLoading, error, refetch } = useMemberships({
    page,
    pageSize: PAGE_SIZE,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  })

  const membersById = useMemo(
    () => Object.fromEntries(members.map((m) => [m.id, m])),
    [members],
  )

  const planOptions = useMemo(() => {
    const ids = new Set(memberships.map((m) => m.planId))
    return plans
      .filter((p) => ids.has(p.id))
      .map((p) => ({ id: p.id, name: p.name }))
  }, [memberships, plans])

  const filteredMemberships = useMemo(() => {
    const q = search.trim().toLowerCase()

    return memberships.filter((m) => {
      if (planFilter !== 'ALL' && m.planId !== planFilter) return false
      if (q) {
        const member = membersById[m.memberId] as (typeof membersById)[string] | undefined
        const fullName = member
          ? `${member.firstName} ${member.lastName}`.toLowerCase()
          : ''
        const memberCode = member?.memberCode.toLowerCase() ?? ''
        const planName = m.planName.toLowerCase()
        if (!fullName.includes(q) && !memberCode.includes(q) && !planName.includes(q)) {
          return false
        }
      }
      return true
    })
  }, [search, planFilter, membersById, memberships])

  const totalPages = meta?.totalPages ?? 1

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handleStatusChange(value: MembershipStatus | 'ALL') {
    setStatusFilter(value)
    setPage(1)
  }

  function handlePlanChange(value: string) {
    setPlanFilter(value)
    setPage(1)
  }

  if (isLoading || membersLoading || plansLoading) {
    return (
      <div className="space-y-5" aria-label="Loading memberships">
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
          <h2 className="text-xl font-semibold text-zinc-900">Memberships</h2>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-5 py-12 text-center">
          <p className="text-sm font-medium text-zinc-700">Failed to load memberships</p>
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

  if (memberships.length === 0) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Memberships</h2>
          <p className="mt-0.5 text-sm text-zinc-500">Manage active and historical memberships.</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-5 py-16 text-center">
          <p className="text-sm font-medium text-zinc-700">No memberships yet</p>
          <p className="mt-1 text-sm text-zinc-500">
            Memberships will appear here once members are assigned plans.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900">Memberships</h2>
        <p className="mt-0.5 text-sm text-zinc-500">
          {meta?.total ?? memberships.length} total memberships
        </p>
      </div>

      <MembershipFilters
        search={search}
        statusFilter={statusFilter}
        planFilter={planFilter}
        planOptions={planOptions}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
        onPlanChange={handlePlanChange}
      />

      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h3 className="text-sm font-semibold text-zinc-900">Membership List</h3>
        </div>

        <MembershipTable memberships={filteredMemberships} membersById={membersById} />

        <MembershipPagination
          page={page}
          totalPages={totalPages}
          totalCount={meta?.total ?? filteredMemberships.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}
