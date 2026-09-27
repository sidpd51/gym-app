import { useState } from 'react'
import type { NotificationRecord } from '../types/notification.types'
import { notificationsMockData } from '../data/notifications.mock'
import { getMemberName } from '../utils/expiry.utils'
import {
  CHANNEL_LABELS,
  formatNotificationDate,
} from '../utils/notification.utils'
import { NotificationStatusBadge } from './NotificationStatusBadge'

const TYPE_LABELS = {
  EXPIRY_REMINDER: 'Expiry Reminder',
  EXPIRED_NOTICE: 'Expired Notice',
  CUSTOM: 'Custom',
} as const

interface ReminderHistoryProps {
  records?: NotificationRecord[]
}

export function ReminderHistory({ records = notificationsMockData }: ReminderHistoryProps) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (records.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white px-6 py-10 text-center">
        <p className="text-sm text-zinc-400">No reminder records yet.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <table className="min-w-full divide-y divide-zinc-200">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
              Member
            </th>
            <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 sm:table-cell">
              Type
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
              Channel
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
              Status
            </th>
            <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 md:table-cell">
              Created
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">
              Message
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {records.map((record) => (
            <>
              <tr key={record.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3 text-sm font-medium text-zinc-800">
                  {getMemberName(record.memberId)}
                </td>
                <td className="hidden px-4 py-3 text-sm text-zinc-600 sm:table-cell">
                  {TYPE_LABELS[record.type]}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-600">
                  {CHANNEL_LABELS[record.channel]}
                </td>
                <td className="px-4 py-3">
                  <NotificationStatusBadge status={record.status} />
                </td>
                <td className="hidden px-4 py-3 text-sm text-zinc-500 md:table-cell">
                  {formatNotificationDate(record.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => setExpanded(expanded === record.id ? null : record.id)}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    {expanded === record.id ? 'Hide' : 'View'}
                  </button>
                </td>
              </tr>
              {expanded === record.id && (
                <tr key={`${record.id}-msg`} className="bg-zinc-50">
                  <td colSpan={6} className="px-4 py-3">
                    <p className="text-sm text-zinc-700">{record.message}</p>
                    {record.sentAt && (
                      <p className="mt-1 text-xs text-zinc-400">
                        Sent at: {formatNotificationDate(record.sentAt)}
                      </p>
                    )}
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}
