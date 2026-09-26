import type { DatePreset, DateRange } from '../types/reports.types'

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function fmtDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function getDateRange(preset: DatePreset, custom?: DateRange): DateRange {
  const today = new Date()
  const y = today.getFullYear()
  const m = today.getMonth()
  const d = today.getDate()
  const todayStr = fmtDate(today)

  switch (preset) {
    case 'TODAY':
      return { start: todayStr, end: todayStr }
    case 'THIS_WEEK': {
      const dow = today.getDay()
      const startOfWeek = new Date(y, m, d - (dow === 0 ? 6 : dow - 1))
      return { start: fmtDate(startOfWeek), end: todayStr }
    }
    case 'THIS_MONTH':
      return { start: `${y}-${pad(m + 1)}-01`, end: todayStr }
    case 'LAST_MONTH': {
      const lastDay = new Date(y, m, 0)
      const lmY = lastDay.getFullYear()
      const lmM = lastDay.getMonth() + 1
      return { start: `${lmY}-${pad(lmM)}-01`, end: fmtDate(lastDay) }
    }
    case 'LAST_3_MONTHS': {
      const start = new Date(y, m - 3, 1)
      return { start: fmtDate(start), end: todayStr }
    }
    case 'THIS_YEAR':
      return { start: `${y}-01-01`, end: todayStr }
    case 'CUSTOM':
      return custom ?? { start: todayStr, end: todayStr }
  }
}

export function inRange(dateStr: string, range: DateRange): boolean {
  return dateStr >= range.start && dateStr <= range.end
}

export function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDisplayRange(range: DateRange): string {
  if (range.start === range.end) return formatDisplayDate(range.start)
  return `${formatDisplayDate(range.start)} – ${formatDisplayDate(range.end)}`
}

export function fmtCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}

export function fmtShort(value: number): string {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`
  return `₹${value}`
}
