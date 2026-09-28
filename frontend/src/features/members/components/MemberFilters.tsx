import { Search } from 'lucide-react'
import { FilterSelect } from '@/components/common/FilterSelect'
import type { MemberStatus, MembershipPlan } from '../types/member.types'

interface MemberFiltersProps {
  search: string
  statusFilter: MemberStatus | 'ALL'
  planFilter: MembershipPlan | 'ALL'
  trainerFilter: string
  trainers: string[]
  onSearchChange: (value: string) => void
  onStatusChange: (value: MemberStatus | 'ALL') => void
  onPlanChange: (value: MembershipPlan | 'ALL') => void
  onTrainerChange: (value: string) => void
}

const STATUS_OPTIONS: { value: MemberStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

const PLAN_OPTIONS: { value: MembershipPlan | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Plans' },
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Quarterly', label: 'Quarterly' },
  { value: 'Half-Yearly', label: 'Half-Yearly' },
  { value: 'Annual', label: 'Annual' },
]

export function MemberFilters({
  search,
  statusFilter,
  planFilter,
  trainerFilter,
  trainers,
  onSearchChange,
  onStatusChange,
  onPlanChange,
  onTrainerChange,
}: MemberFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          placeholder="Search by name, code or phone…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-2">
        <FilterSelect
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value as MemberStatus | 'ALL')}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          value={planFilter}
          onChange={(e) => onPlanChange(e.target.value as MembershipPlan | 'ALL')}
        >
          {PLAN_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          value={trainerFilter}
          onChange={(e) => onTrainerChange(e.target.value)}
        >
          <option value="ALL">All Trainers</option>
          {trainers.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </FilterSelect>
      </div>
    </div>
  )
}
