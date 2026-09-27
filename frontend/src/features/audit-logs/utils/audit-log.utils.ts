import type { DateFilter } from '../types/audit-log.types'

export interface FormattedTimestamp {
  date: string
  time: string
}

export function formatAuditTimestamp(timestamp: string): FormattedTimestamp {
  const [datePart, timePart] = timestamp.split('T')
  const [y, m, d] = datePart.split('-').map(Number)
  const date = new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  let time = ''
  if (timePart) {
    const [h, min] = timePart.split(':').map(Number)
    const period = h >= 12 ? 'PM' : 'AM'
    const hour12 = h % 12 === 0 ? 12 : h % 12
    time = `${hour12}:${String(min).padStart(2, '0')} ${period}`
  }

  return { date, time }
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function matchesDateFilter(
  timestamp: string,
  filter: DateFilter,
  fromDate: string,
  toDate: string,
): boolean {
  if (filter === 'ALL') return true

  const logDate = timestamp.split('T')[0]

  const today = new Date()
  const todayStr = toDateStr(today)

  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const yesterdayStr = toDateStr(yesterday)

  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(today.getDate() - 6)
  const sevenDaysAgoStr = toDateStr(sevenDaysAgo)

  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(today.getDate() - 29)
  const thirtyDaysAgoStr = toDateStr(thirtyDaysAgo)

  switch (filter) {
    case 'TODAY':
      return logDate === todayStr
    case 'YESTERDAY':
      return logDate === yesterdayStr
    case 'LAST_7':
      return logDate >= sevenDaysAgoStr && logDate <= todayStr
    case 'LAST_30':
      return logDate >= thirtyDaysAgoStr && logDate <= todayStr
    case 'CUSTOM':
      if (fromDate && toDate) return logDate >= fromDate && logDate <= toDate
      if (fromDate) return logDate >= fromDate
      if (toDate) return logDate <= toDate
      return true
    default:
      return true
  }
}

export function isTodayTimestamp(timestamp: string): boolean {
  const today = new Date()
  const todayStr = toDateStr(today)
  return timestamp.split('T')[0] === todayStr
}

export interface MetadataChange {
  field: string
  oldValue: string
  newValue: string
}

export function extractChanges(metadata: Record<string, unknown>): MetadataChange[] {
  if (Array.isArray(metadata.changes)) {
    return (metadata.changes as MetadataChange[]).filter(
      (c) => typeof c.field === 'string' && 'oldValue' in c && 'newValue' in c,
    )
  }
  if (
    typeof metadata.field === 'string' &&
    'oldValue' in metadata &&
    'newValue' in metadata
  ) {
    return [
      {
        field: metadata.field,
        oldValue: String(metadata.oldValue),
        newValue: String(metadata.newValue),
      },
    ]
  }
  return []
}

export function extractOtherMetadata(
  metadata: Record<string, unknown>,
): Record<string, string> {
  const changeKeys = new Set(['field', 'oldValue', 'newValue', 'changes'])
  const result: Record<string, string> = {}
  for (const [k, v] of Object.entries(metadata)) {
    if (!changeKeys.has(k) && v !== undefined && v !== null) {
      result[k] = String(v)
    }
  }
  return result
}
