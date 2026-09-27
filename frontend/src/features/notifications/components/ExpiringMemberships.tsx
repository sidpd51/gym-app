import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getExpiringMemberships, formatExpiryDate } from '../utils/expiry.utils'
import { EXPIRY_WINDOW_OPTIONS } from '../types/notification.types'
import type { ExpiryWindow } from '../types/notification.types'

interface ExpiringMembershipsProps {
  onCreateReminder: (memberId: string, membershipId: string) => void
}

export function ExpiringMemberships({ onCreateReminder }: ExpiringMembershipsProps) {
  const [window, setWindow] = useState<ExpiryWindow>(7)

  const memberships = getExpiringMemberships(window)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          {memberships.length === 0
            ? `No memberships expiring in the next ${window} days.`
            : `${memberships.length} membership${memberships.length === 1 ? '' : 's'} expiring within the selected window.`}
        </p>
        <select
          value={window}
          onChange={(e) => setWindow(Number(e.target.value) as ExpiryWindow)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {EXPIRY_WINDOW_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {memberships.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-10 text-center">
          <p className="text-sm text-zinc-400">No memberships expiring in this window.</p>
        </div>
      ) : (
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
                  Expiry Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Days Left
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
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-medium ${
                        ms.daysUntilExpiry <= 3
                          ? 'border-red-200 bg-red-50 text-red-700'
                          : 'border-amber-200 bg-amber-50 text-amber-700'
                      }`}
                    >
                      {ms.daysUntilExpiry === 0
                        ? 'Today'
                        : ms.daysUntilExpiry === 1
                          ? '1 day'
                          : `${ms.daysUntilExpiry} days`}
                    </span>
                  </td>
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
      )}
    </div>
  )
}
