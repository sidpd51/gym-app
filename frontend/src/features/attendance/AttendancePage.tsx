import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { membersMockData } from '../members/data/members.mock'
import { AttendanceFilters } from './components/AttendanceFilters'
import { AttendanceTable } from './components/AttendanceTable'
import { attendanceMockData } from './data/attendance.mock'

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

  const membersById = useMemo(
    () => Object.fromEntries(membersMockData.map((m) => [m.id, m])),
    [],
  )

  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase()
    return attendanceMockData.filter((a) => {
      if (a.attendanceDate !== selectedDate) return false
      if (q) {
        const member = membersById[a.memberId] as (typeof membersById)[string] | undefined
        const fullName = member
          ? `${member.firstName} ${member.lastName}`.toLowerCase()
          : ''
        const memberCode = member?.memberCode.toLowerCase() ?? ''
        const phone = member?.phone ?? ''
        if (!fullName.includes(q) && !memberCode.includes(q) && !phone.includes(q)) {
          return false
        }
      }
      return true
    })
  }, [selectedDate, search, membersById])

  const dateLabel =
    selectedDate === today ? `Today, ${formatLocalDate(today)}` : formatLocalDate(selectedDate)

  function handleDateChange(value: string) {
    setSelectedDate(value)
    setSearch('')
  }

  function handleSearchChange(value: string) {
    setSearch(value)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Attendance</h2>
          <p className="mt-0.5 text-sm text-zinc-500">
            {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''} for{' '}
            {dateLabel}
          </p>
        </div>
        <Link
          to="/attendance/new"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Mark Attendance
        </Link>
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
      </div>
    </div>
  )
}
