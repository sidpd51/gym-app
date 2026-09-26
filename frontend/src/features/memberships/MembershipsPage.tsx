import { useMemo, useState } from 'react'
import { membershipPlansMockData } from '../membership-plans/data/membership-plans.mock'
import { membersMockData } from '../members/data/members.mock'
import { MembershipFilters } from './components/MembershipFilters'
import { MembershipPagination } from './components/MembershipPagination'
import { MembershipTable } from './components/MembershipTable'
import { membershipsMockData } from './data/memberships.mock'
import type { MembershipStatus } from './types/membership.types'

const PAGE_SIZE = 10

export function MembershipsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<MembershipStatus | 'ALL'>('ALL')
  const [planFilter, setPlanFilter] = useState('ALL')
  const [page, setPage] = useState(1)

  const membersById = useMemo(
    () => Object.fromEntries(membersMockData.map((m) => [m.id, m])),
    []
  )

  const planOptions = useMemo(() => {
    const ids = new Set(membershipsMockData.map((m) => m.planId))
    return membershipPlansMockData
      .filter((p) => ids.has(p.id))
      .map((p) => ({ id: p.id, name: p.name }))
  }, [])

  const filteredMemberships = useMemo(() => {
    const q = search.trim().toLowerCase()

    return membershipsMockData.filter((m) => {
      if (statusFilter !== 'ALL' && m.status !== statusFilter) return false
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
  }, [search, statusFilter, planFilter, membersById])

  const totalPages = Math.max(1, Math.ceil(filteredMemberships.length / PAGE_SIZE))
  const pagedMemberships = filteredMemberships.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

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

  if (membershipsMockData.length === 0) {
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
          {membershipsMockData.length} total memberships
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

        <MembershipTable memberships={pagedMemberships} membersById={membersById} />

        <MembershipPagination
          page={page}
          totalPages={totalPages}
          totalCount={filteredMemberships.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}
