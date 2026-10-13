import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { PermissionGate } from '@/features/auth/components/PermissionGate'
import type { UserRole, UserStatus } from '../types/user.types'
import { useUsers } from '../hooks/useUsers'
import { UserFilters } from '../components/UserFilters'
import { UserTable } from '../components/UserTable'

export function UsersPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'ALL'>('ALL')

  const { users, meta, isLoading, error, refetch } = useUsers({
    page: 1,
    pageSize: 100,
    role: roleFilter === 'ALL' ? undefined : roleFilter,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  })

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) => {
      const fullName = `${u.firstName} ${u.lastName}`.toLowerCase()
      return (
        fullName.includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone ?? '').includes(q) ||
        u.userCode.toLowerCase().includes(q)
      )
    })
  }, [users, search])

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
            {isLoading
              ? 'Loading users…'
              : `${meta?.total ?? filteredUsers.length} user${(meta?.total ?? filteredUsers.length) === 1 ? '' : 's'}`}
          </h3>
        </div>
        {isLoading ? (
          <div className="space-y-3 px-5 py-6" aria-label="Loading users">
            {[0, 1, 2].map((row) => (
              <div key={row} className="h-10 animate-pulse rounded-lg bg-zinc-100" />
            ))}
          </div>
        ) : error ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-medium text-zinc-700">Failed to load users</p>
            <p className="mt-1 text-xs text-zinc-500">{error.message}</p>
            <button
              type="button"
              onClick={refetch}
              className="mt-4 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Retry
            </button>
          </div>
        ) : (
          <UserTable users={filteredUsers} />
        )}
      </div>
    </div>
  )
}
