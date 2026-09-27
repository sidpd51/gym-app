export type UserRole = 'OWNER' | 'ADMIN' | 'RECEPTIONIST' | 'TRAINER'
export type UserStatus = 'ACTIVE' | 'INACTIVE'

export interface User {
  id: string
  userCode: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: UserRole
  status: UserStatus
  lastLoginAt?: string
  createdAt: string
}

export const USER_ROLES: { value: UserRole; label: string }[] = [
  { value: 'OWNER', label: 'Owner' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'RECEPTIONIST', label: 'Receptionist' },
  { value: 'TRAINER', label: 'Trainer' },
]

export const USER_STATUSES: { value: UserStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
]
