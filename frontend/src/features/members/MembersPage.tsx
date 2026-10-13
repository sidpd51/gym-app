import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import type { MemberStatus, MembershipPlan } from './types/member.types'
import { useMembers } from './hooks/useMembers'
import { MemberFilters } from './components/MemberFilters'
import { MembersPagination } from './components/MembersPagination'
import { MemberTable } from './components/MemberTable'
import { PermissionGate } from '@/features/auth/components/PermissionGate'

const PAGE_SIZE = 10

type StatusFilter = MemberStatus | 'ALL'
type PlanFilter = MembershipPlan | 'ALL'

export function MembersPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [planFilter, setPlanFilter] = useState<PlanFilter>('ALL')
  const [trainerFilter, setTrainerFilter] = useState<string>('ALL')
  const [page, setPage] = useState(1)

  // Server-side: status filter + pagination. Search is debounced
  // client-side here (backend also supports ?search=).
  const { members, meta, isLoading, error, refetch } = useMembers({
    page,
    pageSize: PAGE_SIZE,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  })

  // membershipPlan/trainerName are UI fields not yet returned by the
  // backend, so plan/trainer filters only apply to whatever the
  // current page contains.
  const trainers = useMemo(
    () => [...new Set(members.map((m) => m.trainerName).filter(Boolean) as string[])].sort(),
    [members],
  )

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return members.filter((m) => {
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
  }, [search, planFilter, trainerFilter, members])

  const totalPages = meta?.totalPages ?? 1

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handleStatusChange(value: StatusFilter) {
    setStatusFilter(value)
    setPage(1)
  }

  function handlePlanChange(value: PlanFilter) {
    setPlanFilter(value)
    setPage(1)
  }

  function handleTrainerChange(value: string) {
    setTrainerFilter(value)
    setPage(1)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Members</h2>
          <p className="mt-0.5 text-sm text-zinc-500">
            {isLoading ? 'Loading…' : `${meta?.total ?? 0} total members`}
          </p>
        </div>
        <PermissionGate permission="members:create">
          <Link
            to="/members/new"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Add Member
          </Link>
        </PermissionGate>
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

        {isLoading ? (
          <div className="space-y-3 px-5 py-6" aria-label="Loading members">
            {[0, 1, 2, 3].map((row) => (
              <div key={row} className="h-10 animate-pulse rounded-lg bg-zinc-100" />
            ))}
          </div>
        ) : error ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-medium text-zinc-700">Failed to load members</p>
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
          <>
            <MemberTable members={filteredMembers} />

            <MembersPagination
              page={page}
              totalPages={totalPages}
              totalCount={meta?.total ?? filteredMembers.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  )
}
