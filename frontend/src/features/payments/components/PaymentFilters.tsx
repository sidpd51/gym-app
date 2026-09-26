import { Search } from 'lucide-react'
import { PAYMENT_METHOD_LABELS } from '../types/payment.types'
import type { PaymentMethod, PaymentStatus } from '../types/payment.types'

interface PaymentFiltersProps {
  search: string
  statusFilter: PaymentStatus | 'ALL'
  methodFilter: PaymentMethod | 'ALL'
  onSearchChange: (value: string) => void
  onStatusChange: (value: PaymentStatus | 'ALL') => void
  onMethodChange: (value: PaymentMethod | 'ALL') => void
}

const STATUS_OPTIONS: { value: PaymentStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'REFUNDED', label: 'Refunded' },
]

const METHOD_OPTIONS: { value: PaymentMethod | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Methods' },
  { value: 'CASH', label: PAYMENT_METHOD_LABELS.CASH },
  { value: 'UPI', label: PAYMENT_METHOD_LABELS.UPI },
  { value: 'CARD', label: PAYMENT_METHOD_LABELS.CARD },
  { value: 'BANK_TRANSFER', label: PAYMENT_METHOD_LABELS.BANK_TRANSFER },
]

export function PaymentFilters({
  search,
  statusFilter,
  methodFilter,
  onSearchChange,
  onStatusChange,
  onMethodChange,
}: PaymentFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          placeholder="Search by member name, code or payment ID…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-2">
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value as PaymentStatus | 'ALL')}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={methodFilter}
          onChange={(e) => onMethodChange(e.target.value as PaymentMethod | 'ALL')}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {METHOD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
