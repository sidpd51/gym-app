import { Link } from 'react-router-dom'
import { getExpiredMemberships, formatExpiryDate } from '../utils/expiry.utils'

interface ExpiredMembershipsProps {
  onCreateReminder: (memberId: string, membershipId: string) => void
}

export function ExpiredMemberships({ onCreateReminder }: ExpiredMembershipsProps) {
  const memberships = getExpiredMemberships()

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">
        {memberships.length} expired membership{memberships.length === 1 ? '' : 's'} on record.
      </p>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                Member
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                Plan
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                Expired On
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                Days Ago
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {memberships.map((ms) => (
              <tr key={ms.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3">
                  <Link
                    to={`/members/${ms.memberId}`}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    {ms.memberName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-zinc-700">{ms.planName}</td>
                <td className="px-4 py-3 text-sm text-zinc-700">
                  {formatExpiryDate(ms.endDate)}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500">{ms.daysExpired} days ago</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onCreateReminder(ms.memberId, ms.id)}
                    className="rounded-md border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    Send Reminder
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
