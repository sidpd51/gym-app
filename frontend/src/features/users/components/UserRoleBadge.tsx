import type { UserRole } from '../types/user.types'

const ROLE_CONFIG: Record<UserRole, { label: string; className: string }> = {
  OWNER: {
    label: 'Owner',
    className: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  ADMIN: {
    label: 'Admin',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  RECEPTIONIST: {
    label: 'Receptionist',
    className: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  TRAINER: {
    label: 'Trainer',
    className: 'bg-green-50 text-green-700 border-green-200',
  },
}

export function UserRoleBadge({ role }: { role: UserRole }) {
  const { label, className } = ROLE_CONFIG[role]
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  )
}
