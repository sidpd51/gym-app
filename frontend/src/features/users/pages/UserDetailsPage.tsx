import { ArrowLeft, Pencil } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useUser } from '../hooks/useUsers'
import { UserAvatar } from '../components/UserAvatar'
import { UserRoleBadge } from '../components/UserRoleBadge'
import { UserStatusBadge } from '../components/UserStatusBadge'

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

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-medium text-zinc-500">{label}</p>
      <div className="text-sm text-zinc-900">{value}</div>
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
      <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  )
}

export function UserDetailsPage() {
  const { userId } = useParams<{ userId: string }>()
  const { user } = useUser(userId)

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-4xl font-bold text-zinc-200">Not Found</p>
        <h2 className="mt-3 text-base font-semibold text-zinc-700">User not found</h2>
        <p className="mt-1 text-sm text-zinc-500">
          No user with ID{' '}
          <span className="font-mono font-medium text-zinc-700">{userId}</span> exists.
        </p>
        <Link
          to="/users"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <Link
        to="/users"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Users
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <UserAvatar firstName={user.firstName} lastName={user.lastName} size="lg" />
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">
              {user.firstName} {user.lastName}
            </h1>
            <p className="mt-0.5 text-sm text-zinc-500">{user.email}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <UserRoleBadge role={user.role} />
              <UserStatusBadge status={user.status} />
            </div>
          </div>
        </div>
        <Link
          to={`/users/${user.id}/edit`}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Edit User
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionCard title="Personal Information">
          <InfoRow label="First Name" value={user.firstName} />
          <InfoRow label="Last Name" value={user.lastName} />
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Phone" value={user.phone ?? '—'} />
        </SectionCard>

        <SectionCard title="Account Information">
          <InfoRow label="User Code" value={<span className="font-mono">{user.userCode}</span>} />
          <InfoRow label="Role" value={<UserRoleBadge role={user.role} />} />
          <InfoRow label="Status" value={<UserStatusBadge status={user.status} />} />
          <InfoRow label="Created" value={formatDate(user.createdAt)} />
          <InfoRow
            label="Last Login"
            value={user.lastLoginAt ? formatDate(user.lastLoginAt) : '—'}
          />
        </SectionCard>
      </div>
    </div>
  )
}
