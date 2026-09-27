import { Search } from 'lucide-react'
import { useUsers } from '@/features/users/hooks/useUsers'
import type { AuditAction, AuditEntityType, AuditStatus, DateFilter } from '../types/audit-log.types'
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_LABELS,
  AUDIT_STATUS_LABELS,
  DATE_FILTER_OPTIONS,
} from '../types/audit-log.types'

const SELECT_CLS =
  'rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500'

interface AuditLogFiltersProps {
  search: string
  actionFilter: AuditAction | 'ALL'
  entityFilter: AuditEntityType | 'ALL'
  statusFilter: AuditStatus | 'ALL'
  userFilter: string
  dateFilter: DateFilter
  fromDate: string
  toDate: string
  onSearchChange: (v: string) => void
  onActionChange: (v: AuditAction | 'ALL') => void
  onEntityChange: (v: AuditEntityType | 'ALL') => void
  onStatusChange: (v: AuditStatus | 'ALL') => void
  onUserChange: (v: string) => void
  onDateFilterChange: (v: DateFilter) => void
  onFromDateChange: (v: string) => void
  onToDateChange: (v: string) => void
}

const ACTIONS: AuditAction[] = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT']
const ENTITY_TYPES: AuditEntityType[] = [
  'USER', 'MEMBER', 'MEMBERSHIP_PLAN', 'MEMBERSHIP', 'PAYMENT', 'ATTENDANCE',
  'TRAINER', 'LEAD', 'EXPENSE', 'INVENTORY_ITEM', 'EQUIPMENT', 'EQUIPMENT_MAINTENANCE',
  'NOTIFICATION', 'SETTINGS',
]
const STATUSES: AuditStatus[] = ['SUCCESS', 'FAILED']

export function AuditLogFilters({
  search,
  actionFilter,
  entityFilter,
  statusFilter,
  userFilter,
  dateFilter,
  fromDate,
  toDate,
  onSearchChange,
  onActionChange,
  onEntityChange,
  onStatusChange,
  onUserChange,
  onDateFilterChange,
  onFromDateChange,
  onToDateChange,
}: AuditLogFiltersProps) {
  const { users } = useUsers()
  const customRangeError =
    dateFilter === 'CUSTOM' && fromDate && toDate && fromDate > toDate
      ? 'From date must be on or before To date'
      : ''

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative min-w-60 flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Search by user, entity, or description…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Action */}
        <select
          value={actionFilter}
          onChange={(e) => onActionChange(e.target.value as AuditAction | 'ALL')}
          className={SELECT_CLS}
          aria-label="Filter by action"
        >
          <option value="ALL">All Actions</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>
              {AUDIT_ACTION_LABELS[a]}
            </option>
          ))}
        </select>

        {/* Entity */}
        <select
          value={entityFilter}
          onChange={(e) => onEntityChange(e.target.value as AuditEntityType | 'ALL')}
          className={SELECT_CLS}
          aria-label="Filter by entity"
        >
          <option value="ALL">All Entities</option>
          {ENTITY_TYPES.map((e) => (
            <option key={e} value={e}>
              {AUDIT_ENTITY_LABELS[e]}
            </option>
          ))}
        </select>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value as AuditStatus | 'ALL')}
          className={SELECT_CLS}
          aria-label="Filter by status"
        >
          <option value="ALL">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {AUDIT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        {/* User */}
        <select
          value={userFilter}
          onChange={(e) => onUserChange(e.target.value)}
          className={SELECT_CLS}
          aria-label="Filter by user"
        >
          <option value="ALL">All Users</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.firstName} {u.lastName}
            </option>
          ))}
        </select>

        {/* Date */}
        <select
          value={dateFilter}
          onChange={(e) => onDateFilterChange(e.target.value as DateFilter)}
          className={SELECT_CLS}
          aria-label="Filter by date"
        >
          {DATE_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Custom date range */}
      {dateFilter === 'CUSTOM' && (
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="fromDate" className="block text-xs font-medium text-zinc-600">
              From
            </label>
            <input
              id="fromDate"
              type="date"
              value={fromDate}
              onChange={(e) => onFromDateChange(e.target.value)}
              className="mt-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="toDate" className="block text-xs font-medium text-zinc-600">
              To
            </label>
            <input
              id="toDate"
              type="date"
              value={toDate}
              onChange={(e) => onToDateChange(e.target.value)}
              className="mt-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {customRangeError && (
            <p className="text-xs text-red-600" role="alert">
              {customRangeError}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
