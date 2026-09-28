import { Search } from 'lucide-react'
import { DatePicker } from '@/components/common/DatePicker'

interface AttendanceFiltersProps {
  date: string
  search: string
  onDateChange: (value: string) => void
  onSearchChange: (value: string) => void
}

export function AttendanceFilters({
  date,
  search,
  onDateChange,
  onSearchChange,
}: AttendanceFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <DatePicker value={date} onChange={onDateChange} />

      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
        <input
          type="search"
          placeholder="Search by name, code or phone…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-4 text-sm outline-none placeholder:text-zinc-400 focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  )
}
