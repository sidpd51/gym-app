import { useMemo, useState } from 'react'
import type { MemberStatus, MembershipPlan } from './types/member.types'
import { membersMockData } from './data/members.mock'
import { MemberFilters } from './components/MemberFilters'
import { MembersPagination } from './components/MembersPagination'
import { MemberTable } from './components/MemberTable'

const PAGE_SIZE = 10

export function MembersPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<MemberStatus | 'ALL'>('ALL')
  const [planFilter, setPlanFilter] = useState<MembershipPlan | 'ALL'>('ALL')
  const [trainerFilter, setTrainerFilter] = useState<string>('ALL')
  const [page, setPage] = useState(1)

  const trainers = useMemo(
    () => [...new Set(membersMockData.map((m) => m.trainerName).filter(Boolean) as string[])].sort(),
    []
  )

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase()

    return membersMockData.filter((m) => {
      if (statusFilter !== 'ALL' && m.status !== statusFilter) return false
      if (planFilter !== 'ALL' && m.membershipPlan !== planFilter) return false
      if (trainerFilter !== 'ALL' && m.trainerName !== trainerFilter) return false
      if (q) {
        const fullName = `${m.firstName} ${m.lastName}`.toLowerCase()
        if (
          !fullName.includes(q) &&
          !m.memberCode.toLowerCase().includes(q) &&
          !m.phone.includes(q)
        ) {
          return false
        }
      }
      return true
    })
  }, [search, statusFilter, planFilter, trainerFilter])

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / PAGE_SIZE))
  const pagedMembers = filteredMembers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handleStatusChange(value: MemberStatus | 'ALL') {
    setStatusFilter(value)
    setPage(1)
  }

  function handlePlanChange(value: MembershipPlan | 'ALL') {
    setPlanFilter(value)
    setPage(1)
  }

  function handleTrainerChange(value: string) {
    setTrainerFilter(value)
    setPage(1)
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900">Members</h2>
        <p className="mt-0.5 text-sm text-zinc-500">
          {membersMockData.length} total members
        </p>
      </div>

      <MemberFilters
        search={search}
        statusFilter={statusFilter}
        planFilter={planFilter}
        trainerFilter={trainerFilter}
        trainers={trainers}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
        onPlanChange={handlePlanChange}
        onTrainerChange={handleTrainerChange}
      />

      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h3 className="text-sm font-semibold text-zinc-900">Member List</h3>
        </div>

        <MemberTable members={pagedMembers} />

        <MembersPagination
          page={page}
          totalPages={totalPages}
          totalCount={filteredMembers.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}
