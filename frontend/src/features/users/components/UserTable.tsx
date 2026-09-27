import { Link } from 'react-router-dom'
import type { User } from '../types/user.types'
import { PermissionGate } from '@/features/auth/components/PermissionGate'
import { UserAvatar } from './UserAvatar'
import { UserRoleBadge } from './UserRoleBadge'
import { UserStatusBadge } from './UserStatusBadge'

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  const [datePart] = dateStr.split('T')
  const [y, m, d] = datePart.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

interface UserTableProps {
  users: User[]
}

export function UserTable({ users }: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="px-5 py-12 text-center text-sm text-zinc-500">
        No users match your filters.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-100 text-left">
            <th scope="col" className="px-5 py-3 text-xs font-medium text-zinc-500">
              User
            </th>
            <th scope="col" className="px-5 py-3 text-xs font-medium text-zinc-500">
              Code
            </th>
            <th scope="col" className="hidden px-5 py-3 text-xs font-medium text-zinc-500 sm:table-cell">
              Phone
            </th>
            <th scope="col" className="px-5 py-3 text-xs font-medium text-zinc-500">
              Role
            </th>
            <th scope="col" className="px-5 py-3 text-xs font-medium text-zinc-500">
              Status
            </th>
            <th scope="col" className="hidden px-5 py-3 text-xs font-medium text-zinc-500 md:table-cell">
              Last Login
            </th>
            <th scope="col" className="px-5 py-3 text-xs font-medium text-zinc-500">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-zinc-50 last:border-0">
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <UserAvatar firstName={user.firstName} lastName={user.lastName} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-900">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="truncate text-xs text-zinc-500">{user.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3 font-mono text-xs text-zinc-500">{user.userCode}</td>
              <td className="hidden px-5 py-3 tabular-nums text-zinc-600 sm:table-cell">
                {user.phone ?? '—'}
              </td>
              <td className="px-5 py-3">
                <UserRoleBadge role={user.role} />
              </td>
              <td className="px-5 py-3">
                <UserStatusBadge status={user.status} />
              </td>
              <td className="hidden px-5 py-3 text-zinc-500 md:table-cell">
                {formatDate(user.lastLoginAt)}
              </td>
              <td className="px-5 py-3">
                <div className="flex items-center gap-2">
                  <Link
                    to={`/users/${user.id}`}
                    className="rounded px-2.5 py-1 text-xs font-medium text-blue-600 ring-1 ring-inset ring-blue-300 hover:bg-blue-50"
                  >
                    View
                  </Link>
                  <PermissionGate permission="users:edit">
                    <Link
                      to={`/users/${user.id}/edit`}
                      className="rounded px-2.5 py-1 text-xs font-medium text-zinc-600 ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50"
                    >
                      Edit
                    </Link>
                  </PermissionGate>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
