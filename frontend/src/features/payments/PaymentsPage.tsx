import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { membersMockData } from '../members/data/members.mock'
import { PaymentFilters } from './components/PaymentFilters'
import { PaymentPagination } from './components/PaymentPagination'
import { PaymentTable } from './components/PaymentTable'
import { paymentsMockData } from './data/payments.mock'
import type { PaymentMethod, PaymentStatus } from './types/payment.types'

const PAGE_SIZE = 10

export function PaymentsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'ALL'>('ALL')
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'ALL'>('ALL')
  const [page, setPage] = useState(1)

  const membersById = useMemo(
    () => Object.fromEntries(membersMockData.map((m) => [m.id, m])),
    []
  )

  const filteredPayments = useMemo(() => {
    const q = search.trim().toLowerCase()

    return paymentsMockData.filter((p) => {
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false
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
  }, [search, statusFilter, methodFilter, membersById])

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / PAGE_SIZE))
  const pagedPayments = filteredPayments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

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

  if (paymentsMockData.length === 0) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">Payments</h2>
            <p className="mt-0.5 text-sm text-zinc-500">
              Track membership payments and financial transactions.
            </p>
          </div>
          <Link
            to="/payments/new"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Record Payment
          </Link>
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
            {paymentsMockData.length} total payments
          </p>
        </div>
        <Link
          to="/payments/new"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Record Payment
        </Link>
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

        <PaymentTable payments={pagedPayments} membersById={membersById} />

        <PaymentPagination
          page={page}
          totalPages={totalPages}
          totalCount={filteredPayments.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}
