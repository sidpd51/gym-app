import { Search } from 'lucide-react'
import type { TrainerStatus } from '../types/trainer.types'

type StatusFilter = TrainerStatus | 'ALL'

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
]

interface TrainerFiltersProps {
  search: string
  statusFilter: StatusFilter
  onSearchChange: (value: string) => void
  onStatusChange: (value: StatusFilter) => void
}

export function TrainerFilters({
  search,
  statusFilter,
  onSearchChange,
  onStatusChange,
}: TrainerFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
        <input
          type="search"
          placeholder="Search trainers…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-4 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400"
          aria-label="Search trainers"
        />
      </div>

      <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1">
        {STATUS_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => onStatusChange(value)}
            className={
              statusFilter === value
                ? 'rounded-md bg-zinc-900 px-3 py-1 text-xs font-medium text-white'
                : 'rounded-md px-3 py-1 text-xs font-medium text-zinc-500 hover:text-zinc-900'
            }
            aria-pressed={statusFilter === value}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
