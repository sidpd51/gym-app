export type DatePreset =
  | 'TODAY'
  | 'THIS_WEEK'
  | 'THIS_MONTH'
  | 'LAST_MONTH'
  | 'LAST_3_MONTHS'
  | 'THIS_YEAR'
  | 'CUSTOM'

export const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  TODAY: 'Today',
  THIS_WEEK: 'This Week',
  THIS_MONTH: 'This Month',
  LAST_MONTH: 'Last Month',
  LAST_3_MONTHS: 'Last 3 Months',
  THIS_YEAR: 'This Year',
  CUSTOM: 'Custom',
}

export const DATE_PRESETS: DatePreset[] = [
  'TODAY',
  'THIS_WEEK',
  'THIS_MONTH',
  'LAST_MONTH',
  'LAST_3_MONTHS',
  'THIS_YEAR',
  'CUSTOM',
]

export type ReportTab =
  | 'overview'
  | 'members'
  | 'memberships'
  | 'revenue'
  | 'attendance'
  | 'expenses'
  | 'leads'

export const REPORT_TABS: { id: ReportTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'members', label: 'Members' },
  { id: 'memberships', label: 'Memberships' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'leads', label: 'Leads' },
]

export interface DateRange {
  start: string
  end: string
}
