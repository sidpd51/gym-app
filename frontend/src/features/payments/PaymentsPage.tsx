import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useMembers } from '../members/hooks/useMembers'
import { PaymentFilters } from './components/PaymentFilters'
import { PaymentPagination } from './components/PaymentPagination'
import { PaymentTable } from './components/PaymentTable'
import { usePayments } from './hooks/usePayments'
import type { PaymentMethod, PaymentStatus } from './types/payment.types'
import { PermissionGate } from '@/features/auth/components/PermissionGate'

const PAGE_SIZE = 10

export function PaymentsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'ALL'>('ALL')
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'ALL'>('ALL')
  const [page, setPage] = useState(1)

  const { members, isLoading: membersLoading } = useMembers()
  const { payments, meta, isLoading, error, refetch } = usePayments({
    page,
    pageSize: PAGE_SIZE,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  })

  const membersById = useMemo(
    () => Object.fromEntries(members.map((m) => [m.id, m])),
    [members],
  )

  // method filter is not a backend query param — applied client-side
  // over the current page; search is also client-side.
  const filteredPayments = useMemo(() => {
    const q = search.trim().toLowerCase()

    return payments.filter((p) => {
      if (methodFilter !== 'ALL' && p.paymentMethod !== methodFilter) return false
      if (q) {
        const member = membersById[p.memberId] as (typeof membersById)[string] | undefined
        const fullName = member
          ? `${member.firstName} ${member.lastName}`.toLowerCase()
          : ''
        const memberCode = member?.memberCode.toLowerCase() ?? ''
        const paymentId = p.id.toLowerCase()
        const reference = (p.reference ?? '').toLowerCase()
        if (
          !fullName.includes(q) &&
          !memberCode.includes(q) &&
          !paymentId.includes(q) &&
          !reference.includes(q)
        ) {
          return false
        }
      }
      return true
    })
  }, [search, methodFilter, membersById, payments])

  const totalPages = meta?.totalPages ?? 1

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handleStatusChange(value: PaymentStatus | 'ALL') {
    setStatusFilter(value)
    setPage(1)
  }

  function handleMethodChange(value: PaymentMethod | 'ALL') {
    setMethodFilter(value)
    setPage(1)
  }

  if (isLoading || membersLoading) {
    return (
      <div className="space-y-5" aria-label="Loading payments">
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
          <h2 className="text-xl font-semibold text-zinc-900">Payments</h2>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-5 py-12 text-center">
          <p className="text-sm font-medium text-zinc-700">Failed to load payments</p>
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

  if (payments.length === 0) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">Payments</h2>
            <p className="mt-0.5 text-sm text-zinc-500">
              Track membership payments and financial transactions.
            </p>
          </div>
          <PermissionGate permission="payments:record">
            <Link
              to="/payments/new"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Record Payment
            </Link>
          </PermissionGate>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-5 py-16 text-center">
          <p className="text-sm font-medium text-zinc-700">No payments yet</p>
          <p className="mt-1 text-sm text-zinc-500">
            Payments will appear here once they are recorded.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Payments</h2>
          <p className="mt-0.5 text-sm text-zinc-500">
            {meta?.total ?? payments.length} total payments
          </p>
        </div>
        <PermissionGate permission="payments:record">
          <Link
            to="/payments/new"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Record Payment
          </Link>
        </PermissionGate>
      </div>

      <PaymentFilters
        search={search}
        statusFilter={statusFilter}
        methodFilter={methodFilter}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
        onMethodChange={handleMethodChange}
      />

      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h3 className="text-sm font-semibold text-zinc-900">Payment History</h3>
        </div>

        <PaymentTable payments={filteredPayments} membersById={membersById} />

        <PaymentPagination
          page={page}
          totalPages={totalPages}
          totalCount={meta?.total ?? filteredPayments.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}
