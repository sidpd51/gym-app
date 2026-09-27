import { Link } from 'react-router-dom'
import { useUsers } from '@/features/users/hooks/useUsers'
import type { AuditLog } from '../types/audit-log.types'
import { AUDIT_ENTITY_LABELS } from '../types/audit-log.types'
import { formatAuditTimestamp } from '../utils/audit-log.utils'
import { AuditActionBadge } from './AuditActionBadge'
import { AuditStatusBadge } from './AuditStatusBadge'

interface AuditLogTableProps {
  logs: AuditLog[]
}

export function AuditLogTable({ logs }: AuditLogTableProps) {
  const { users } = useUsers()
  const usersById = Object.fromEntries(users.map((u) => [u.id, u]))
  if (logs.length === 0) {
    return (
      <div className="px-5 py-12 text-center">
        <p className="text-sm font-medium text-zinc-700">No audit events found</p>
        <p className="mt-1 text-xs text-zinc-500">
          No audit events match your current filters.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-100 text-left">
            <th scope="col" className="px-5 py-3 text-xs font-medium text-zinc-500">
              Time
            </th>
            <th scope="col" className="px-5 py-3 text-xs font-medium text-zinc-500">
              User
            </th>
            <th scope="col" className="px-5 py-3 text-xs font-medium text-zinc-500">
              Action
            </th>
            <th scope="col" className="hidden px-5 py-3 text-xs font-medium text-zinc-500 sm:table-cell">
              Entity
            </th>
            <th scope="col" className="hidden px-5 py-3 text-xs font-medium text-zinc-500 md:table-cell">
              Target
            </th>
            <th scope="col" className="hidden px-5 py-3 text-xs font-medium text-zinc-500 lg:table-cell">
              Description
            </th>
            <th scope="col" className="px-5 py-3 text-xs font-medium text-zinc-500">
              Status
            </th>
            <th scope="col" className="px-5 py-3 text-xs font-medium text-zinc-500">
              <span className="sr-only">View</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => {
            const user = usersById[log.userId] as (typeof usersById)[string] | undefined
            const userName = user
              ? `${user.firstName} ${user.lastName}`
              : `User ${log.userId}`
            const { date, time } = formatAuditTimestamp(log.timestamp)

            return (
              <tr key={log.id} className="border-b border-zinc-50 last:border-0">
                <td className="px-5 py-3">
                  <p className="whitespace-nowrap text-xs font-medium text-zinc-900">{date}</p>
                  {time && (
                    <p className="mt-0.5 whitespace-nowrap text-xs text-zinc-400">{time}</p>
                  )}
                </td>
                <td className="px-5 py-3">
                  <p className="truncate font-medium text-zinc-900">{userName}</p>
                  {user && (
                    <p className="mt-0.5 font-mono text-xs text-zinc-400">{user.userCode}</p>
                  )}
                </td>
                <td className="px-5 py-3">
                  <AuditActionBadge action={log.action} />
                </td>
                <td className="hidden px-5 py-3 text-xs text-zinc-600 sm:table-cell">
                  {AUDIT_ENTITY_LABELS[log.entityType]}
                </td>
                <td className="hidden max-w-36 px-5 py-3 md:table-cell">
                  {log.entityName ? (
                    <p className="truncate text-xs font-medium text-zinc-800">{log.entityName}</p>
                  ) : log.entityId ? (
                    <p className="font-mono text-xs text-zinc-500">{log.entityId}</p>
                  ) : (
                    <span className="text-xs text-zinc-400">—</span>
                  )}
                </td>
                <td className="hidden max-w-56 px-5 py-3 lg:table-cell">
                  <p className="truncate text-xs text-zinc-600">{log.description}</p>
                </td>
                <td className="px-5 py-3">
                  <AuditStatusBadge status={log.status} />
                </td>
                <td className="px-5 py-3">
                  <Link
                    to={`/audit-logs/${log.id}`}
                    className="rounded px-2.5 py-1 text-xs font-medium text-blue-600 ring-1 ring-inset ring-blue-300 hover:bg-blue-50"
                  >
                    View
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
