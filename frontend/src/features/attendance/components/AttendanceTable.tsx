import { Link } from 'react-router-dom'
import type { Member } from '../../members/types/member.types'
import type { Attendance } from '../types/attendance.types'
import { AttendanceStatusBadge } from './AttendanceStatusBadge'

function formatTime12h(time: string): string {
  const [hStr, mStr] = time.split(':')
  const h = Number(hStr)
  const m = mStr
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${String(h12).padStart(2, '0')}:${m} ${period}`
}

interface AttendanceTableProps {
  records: Attendance[]
  membersById: Record<string, Member>
}

export function AttendanceTable({ records, membersById }: AttendanceTableProps) {
  if (records.length === 0) {
    return (
      <div className="px-5 py-12 text-center">
        <p className="text-sm font-medium text-zinc-700">No attendance records found</p>
        <p className="mt-1 text-sm text-zinc-500">Try changing the date or search term.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-100 bg-zinc-50">
            <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Member</th>
            <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Member Code</th>
            <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Check-in Time</th>
            <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {records.map((record) => {
            const member = membersById[record.memberId] as Member | undefined
            return (
              <tr key={record.id} className="hover:bg-zinc-50">
                <td className="px-5 py-3">
                  {member ? (
                    <Link to={`/members/${member.id}`} className="group flex flex-col">
                      <span className="font-medium text-zinc-900 group-hover:text-blue-600">
                        {member.firstName} {member.lastName}
                      </span>
                      <span className="text-xs text-zinc-400">{member.phone}</span>
                    </Link>
                  ) : (
                    <span className="text-zinc-400">Unknown member</span>
                  )}
                </td>
                <td className="px-5 py-3 font-mono text-xs text-zinc-600">
                  {member?.memberCode ?? '—'}
                </td>
                <td className="px-5 py-3 tabular-nums text-zinc-600">
                  {formatTime12h(record.checkInTime)}
                </td>
                <td className="px-5 py-3">
                  <AttendanceStatusBadge status={record.status} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
