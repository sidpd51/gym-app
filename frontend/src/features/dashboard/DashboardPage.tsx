import { Activity, Clock, UserCheck, Users } from 'lucide-react'
import { useDashboard } from './hooks/useDashboard'
import { AttendanceSummary } from './components/AttendanceSummary'
import { DashboardHeader } from './components/DashboardHeader'
import { ExpiringMemberships } from './components/ExpiringMemberships'
import { MembershipOverview } from './components/MembershipOverview'
import { RecentPayments } from './components/RecentPayments'
import { RevenueChart } from './components/RevenueChart'
import { StatCard } from './components/StatCard'

export function DashboardPage() {
  const { data } = useDashboard()
  const {
    stats,
    revenueData,
    membershipDistribution,
    attendanceSnapshot,
    expiringMemberships,
    recentPayments,
  } = data

  const activePct = ((stats.activeMembers / stats.totalMembers) * 100).toFixed(1)

  return (
    <div className="flex grow flex-col gap-6">
      <DashboardHeader />

      {/* Summary stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Members"
          value={stats.totalMembers.toLocaleString('en-IN')}
          icon={Users}
          iconContainerClassName="bg-blue-50"
          iconColorClassName="text-blue-600"
          trend={{ value: '+42 this month', direction: 'up' }}
        />
        <StatCard
          title="Active Members"
          value={stats.activeMembers.toLocaleString('en-IN')}
          icon={UserCheck}
          iconContainerClassName="bg-green-50"
          iconColorClassName="text-green-600"
          description={`${activePct}% of total`}
        />
        <StatCard
          title="Expiring Soon"
          value={stats.expiringMemberships}
          icon={Clock}
          iconContainerClassName="bg-amber-50"
          iconColorClassName="text-amber-600"
          description="Within next 7 days"
        />
        <StatCard
          title="Today's Attendance"
          value={stats.todayAttendance}
          icon={Activity}
          iconContainerClassName="bg-purple-50"
          iconColorClassName="text-purple-600"
          trend={{ value: '+12% vs yesterday', direction: 'up' }}
        />
      </div>

      {/* Revenue chart */}
      <RevenueChart data={revenueData} />

      {/* Membership distribution + attendance */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MembershipOverview data={membershipDistribution} />
        <AttendanceSummary data={attendanceSnapshot} />
      </div>

      {/* Expiring memberships */}
      <ExpiringMemberships data={expiringMemberships} />

      {/* Recent payments — grows to consume remaining viewport height on tall screens */}
      <div className="flex grow flex-col">
        <RecentPayments data={recentPayments} />
      </div>
    </div>
  )
}
