import { Search } from 'lucide-react'

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
      <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2">
        <label className="text-xs font-medium text-zinc-500 whitespace-nowrap">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="text-sm text-zinc-900 outline-none"
        />
      </div>

      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          placeholder="Search by name, code or phone…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-4 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400"
        />
      </div>
    </div>
  )
}
