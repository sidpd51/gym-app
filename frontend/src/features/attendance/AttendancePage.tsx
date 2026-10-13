import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useAttendance } from './hooks/useAttendance'
import { useMembers } from '../members/hooks/useMembers'
import { AttendanceFilters } from './components/AttendanceFilters'
import { AttendanceTable } from './components/AttendanceTable'
import { PermissionGate } from '@/features/auth/components/PermissionGate'

const PAGE_SIZE = 20

function getTodayString(): string {
  const d = new Date()
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${day}`
}

function formatLocalDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function AttendancePage() {
  const today = getTodayString()
  const [selectedDate, setSelectedDate] = useState(today)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { members, isLoading: membersLoading } = useMembers()
  const { attendance, meta, isLoading, error, refetch } = useAttendance({
    page,
    pageSize: PAGE_SIZE,
    fromDate: selectedDate,
    toDate: selectedDate,
  })

  const membersById = useMemo(
    () => Object.fromEntries(members.map((m) => [m.id, m])),
    [members],
  )

  // search is client-side (backend attendance list has no search param)
  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return attendance
    return attendance.filter((a) => {
      const member = membersById[a.memberId] as (typeof membersById)[string] | undefined
      const fullName = member
        ? `${member.firstName} ${member.lastName}`.toLowerCase()
        : ''
      const memberCode = member?.memberCode.toLowerCase() ?? ''
      const phone = member?.phone ?? ''
      return fullName.includes(q) || memberCode.includes(q) || phone.includes(q)
    })
  }, [attendance, search, membersById])

  const totalPages = meta?.totalPages ?? 1
  const dateLabel =
    selectedDate === today ? `Today, ${formatLocalDate(today)}` : formatLocalDate(selectedDate)

  function handleDateChange(value: string) {
    setSelectedDate(value)
    setSearch('')
    setPage(1)
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  if (isLoading || membersLoading) {
    return (
      <div className="space-y-5" aria-label="Loading attendance">
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
          <h2 className="text-xl font-semibold text-zinc-900">Attendance</h2>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-5 py-12 text-center">
          <p className="text-sm font-medium text-zinc-700">Failed to load attendance</p>
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Attendance</h2>
          <p className="mt-0.5 text-sm text-zinc-500">
            {meta?.total ?? attendance.length} record{(meta?.total ?? attendance.length) !== 1 ? 's' : ''} for{' '}
            {dateLabel}
          </p>
        </div>
        <PermissionGate permission="attendance:mark">
          <Link
            to="/attendance/new"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Mark Attendance
          </Link>
        </PermissionGate>
      </div>

      <AttendanceFilters
        date={selectedDate}
        search={search}
        onDateChange={handleDateChange}
        onSearchChange={handleSearchChange}
      />

      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h3 className="text-sm font-semibold text-zinc-900">Attendance Log</h3>
        </div>
        <AttendanceTable records={filteredRecords} membersById={membersById} />

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 border-t border-zinc-100 px-5 py-3">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex h-7 w-7 items-center justify-center rounded border border-zinc-200 text-zinc-500 disabled:opacity-40 hover:enabled:bg-zinc-50"
              aria-label="Previous page"
            >
              ‹
            </button>
            <span className="px-2 text-xs text-zinc-500">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="inline-flex h-7 w-7 items-center justify-center rounded border border-zinc-200 text-zinc-500 disabled:opacity-40 hover:enabled:bg-zinc-50"
              aria-label="Next page"
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
