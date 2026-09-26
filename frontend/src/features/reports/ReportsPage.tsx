import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { REPORT_TABS } from './types/reports.types'
import type { ReportTab, DateRange } from './types/reports.types'
import { getDateRange } from './utils/report-filters'
import { ReportDateFilter } from './components/ReportDateFilter'
import { OverviewReport } from './components/OverviewReport'
import { MembersReport } from './components/MembersReport'
import { MembershipsReport } from './components/MembershipsReport'
import { RevenueReport } from './components/RevenueReport'
import { AttendanceReport } from './components/AttendanceReport'
import { ExpensesReport } from './components/ExpensesReport'
import { LeadsReport } from './components/LeadsReport'

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('overview')
  const [range, setRange] = useState<DateRange>(() => getDateRange('THIS_MONTH'))

  const handleRangeChange = useCallback((r: DateRange) => setRange(r), [])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Reports</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Operational summaries across all gym activities.
        </p>
      </div>

      <ReportDateFilter onRangeChange={handleRangeChange} />

      <div className="border-b border-zinc-200">
        <nav className="-mb-px flex overflow-x-auto" aria-label="Report sections">
          {REPORT_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-zinc-900 text-zinc-900'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && <OverviewReport range={range} />}
      {activeTab === 'members' && <MembersReport range={range} />}
      {activeTab === 'memberships' && <MembershipsReport range={range} />}
      {activeTab === 'revenue' && <RevenueReport range={range} />}
      {activeTab === 'attendance' && <AttendanceReport range={range} />}
      {activeTab === 'expenses' && <ExpensesReport range={range} />}
      {activeTab === 'leads' && <LeadsReport range={range} />}
    </div>
  )
}
