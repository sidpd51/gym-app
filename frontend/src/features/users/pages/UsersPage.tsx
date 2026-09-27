import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { PermissionGate } from '@/features/auth/components/PermissionGate'
import type { UserRole, UserStatus } from '../types/user.types'
import { usersMockData } from '../data/users.mock'
import { UserFilters } from '../components/UserFilters'
import { UserTable } from '../components/UserTable'

export function UsersPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'ALL'>('ALL')

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return usersMockData.filter((u) => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false
      if (statusFilter !== 'ALL' && u.status !== statusFilter) return false
      if (q) {
        const fullName = `${u.firstName} ${u.lastName}`.toLowerCase()
        if (
          !fullName.includes(q) &&
          !u.email.toLowerCase().includes(q) &&
          !(u.phone ?? '').includes(q) &&
          !u.userCode.toLowerCase().includes(q)
        ) {
          return false
        }
      }
      return true
    })
  }, [search, roleFilter, statusFilter])

  function handleSearchChange(value: string) {
    setSearch(value)
  }

  function handleRoleChange(value: UserRole | 'ALL') {
    setRoleFilter(value)
  }

  function handleStatusChange(value: UserStatus | 'ALL') {
    setStatusFilter(value)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Users</h2>
          <p className="mt-0.5 text-sm text-zinc-500">
            Manage application users and their access roles.
          </p>
        </div>
        <PermissionGate permission="users:create">
          <Link
            to="/users/new"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Add User
          </Link>
        </PermissionGate>
      </div>

      <UserFilters
        search={search}
        roleFilter={roleFilter}
        statusFilter={statusFilter}
        onSearchChange={handleSearchChange}
        onRoleChange={handleRoleChange}
        onStatusChange={handleStatusChange}
      />

      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h3 className="text-sm font-semibold text-zinc-900">
            {filteredUsers.length} user{filteredUsers.length === 1 ? '' : 's'}
          </h3>
        </div>
        <UserTable users={filteredUsers} />
      </div>
    </div>
  )
}
