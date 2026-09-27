export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'VIEW'
  | 'EXPORT'

export type AuditEntityType =
  | 'USER'
  | 'MEMBER'
  | 'MEMBERSHIP_PLAN'
  | 'MEMBERSHIP'
  | 'PAYMENT'
  | 'ATTENDANCE'
  | 'TRAINER'
  | 'LEAD'
  | 'EXPENSE'
  | 'INVENTORY_ITEM'
  | 'EQUIPMENT'
  | 'EQUIPMENT_MAINTENANCE'
  | 'NOTIFICATION'
  | 'SETTINGS'

export type AuditStatus = 'SUCCESS' | 'FAILED'

export interface AuditLog {
  id: string
  timestamp: string
  userId: string
  action: AuditAction
  entityType: AuditEntityType
  entityId?: string
  entityName?: string
  description: string
  status: AuditStatus
  metadata?: Record<string, unknown>
}

export type DateFilter = 'ALL' | 'TODAY' | 'YESTERDAY' | 'LAST_7' | 'LAST_30' | 'CUSTOM'

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  CREATE: 'Create',
  UPDATE: 'Update',
  DELETE: 'Delete',
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  VIEW: 'View',
  EXPORT: 'Export',
}

export const AUDIT_ENTITY_LABELS: Record<AuditEntityType, string> = {
  USER: 'User',
  MEMBER: 'Member',
  MEMBERSHIP_PLAN: 'Membership Plan',
  MEMBERSHIP: 'Membership',
  PAYMENT: 'Payment',
  ATTENDANCE: 'Attendance',
  TRAINER: 'Trainer',
  LEAD: 'Lead',
  EXPENSE: 'Expense',
  INVENTORY_ITEM: 'Inventory',
  EQUIPMENT: 'Equipment',
  EQUIPMENT_MAINTENANCE: 'Maintenance',
  NOTIFICATION: 'Notification',
  SETTINGS: 'Settings',
}

export const AUDIT_STATUS_LABELS: Record<AuditStatus, string> = {
  SUCCESS: 'Success',
  FAILED: 'Failed',
}

export const DATE_FILTER_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: 'ALL', label: 'All Time' },
  { value: 'TODAY', label: 'Today' },
  { value: 'YESTERDAY', label: 'Yesterday' },
  { value: 'LAST_7', label: 'Last 7 Days' },
  { value: 'LAST_30', label: 'Last 30 Days' },
  { value: 'CUSTOM', label: 'Custom Range' },
]
