import { Search } from 'lucide-react'
import { FilterSelect } from '@/components/common/FilterSelect'
import { LEAD_STATUS_LABELS, LEAD_SOURCE_LABELS } from '../types/lead.types'
import type { LeadStatus, LeadSource } from '../types/lead.types'

const STATUS_OPTIONS: { value: LeadStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Statuses' },
  ...Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => ({
    value: value as LeadStatus,
    label,
  })),
]

const SOURCE_OPTIONS: { value: LeadSource | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Sources' },
  ...Object.entries(LEAD_SOURCE_LABELS).map(([value, label]) => ({
    value: value as LeadSource,
    label,
  })),
]

interface LeadFiltersProps {
  search: string
  statusFilter: LeadStatus | 'ALL'
  sourceFilter: LeadSource | 'ALL'
  onSearchChange: (value: string) => void
  onStatusChange: (value: LeadStatus | 'ALL') => void
  onSourceChange: (value: LeadSource | 'ALL') => void
}

export function LeadFilters({
  search,
  statusFilter,
  sourceFilter,
  onSearchChange,
  onStatusChange,
  onSourceChange,
}: LeadFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder="Search by name, phone, email or code…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Search leads"
        />
      </div>

      <div className="flex gap-2">
        <FilterSelect
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value as LeadStatus | 'ALL')}
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          value={sourceFilter}
          onChange={(e) => onSourceChange(e.target.value as LeadSource | 'ALL')}
          aria-label="Filter by source"
        >
          {SOURCE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </FilterSelect>
      </div>
    </div>
  )
}
