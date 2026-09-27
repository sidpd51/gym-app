import { useMemberNotifications } from '../hooks/useNotifications'
import { CHANNEL_LABELS, formatNotificationDate } from '../utils/notification.utils'
import { NotificationStatusBadge } from './NotificationStatusBadge'

interface MemberReminderHistoryProps {
  memberId: string
}

const TYPE_LABELS = {
  EXPIRY_REMINDER: 'Expiry Reminder',
  EXPIRED_NOTICE: 'Expired Notice',
  CUSTOM: 'Custom',
} as const

export function MemberReminderHistory({ memberId }: MemberReminderHistoryProps) {
  const { notifications: records } = useMemberNotifications(memberId)

  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
      <h2 className="text-sm font-semibold text-zinc-900">Reminder History</h2>

      {records.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-400">No reminders have been sent to this member.</p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Type
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Channel
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Status
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {records.map((record) => (
                <tr key={record.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 text-sm text-zinc-700">{TYPE_LABELS[record.type]}</td>
                  <td className="px-4 py-3 text-sm text-zinc-700">
                    {CHANNEL_LABELS[record.channel]}
                  </td>
                  <td className="px-4 py-3">
                    <NotificationStatusBadge status={record.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500">
                    {formatNotificationDate(record.createdAt)}
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
