import { Search } from 'lucide-react'
import { FilterSelect } from '@/components/common/FilterSelect'
import type { MembershipStatus } from '../types/membership.types'

interface PlanOption {
  id: string
  name: string
}

interface MembershipFiltersProps {
  search: string
  statusFilter: MembershipStatus | 'ALL'
  planFilter: string
  planOptions: PlanOption[]
  onSearchChange: (value: string) => void
  onStatusChange: (value: MembershipStatus | 'ALL') => void
  onPlanChange: (value: string) => void
}

const STATUS_OPTIONS: { value: MembershipStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

export function MembershipFilters({
  search,
  statusFilter,
  planFilter,
  planOptions,
  onSearchChange,
  onStatusChange,
  onPlanChange,
}: MembershipFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          placeholder="Search by member name, code or plan…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-2">
        <FilterSelect
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value as MembershipStatus | 'ALL')}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          value={planFilter}
          onChange={(e) => onPlanChange(e.target.value)}
        >
          <option value="ALL">All Plans</option>
          {planOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </FilterSelect>
      </div>
    </div>
  )
}
