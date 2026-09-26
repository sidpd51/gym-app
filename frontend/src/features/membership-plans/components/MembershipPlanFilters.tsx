import { Search } from 'lucide-react'
import type { MembershipPlanStatus } from '../types/membership-plan.types'

type StatusFilter = MembershipPlanStatus | 'ALL'

interface MembershipPlanFiltersProps {
  search: string
  statusFilter: StatusFilter
  onSearchChange: (value: string) => void
  onStatusChange: (value: StatusFilter) => void
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
]

export function MembershipPlanFilters({
  search,
  statusFilter,
  onSearchChange,
  onStatusChange,
}: MembershipPlanFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          placeholder="Search plans…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex gap-1 rounded-lg border border-zinc-200 bg-white p-1">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onStatusChange(opt.value)}
            className={
              statusFilter === opt.value
                ? 'rounded-md bg-zinc-900 px-3 py-1 text-xs font-medium text-white'
                : 'rounded-md px-3 py-1 text-xs font-medium text-zinc-500 hover:text-zinc-900'
            }
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
