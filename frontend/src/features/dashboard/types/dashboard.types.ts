export interface DashboardStats {
  totalMembers: number
  activeMembers: number
  expiringMemberships: number
  todayAttendance: number
}

export interface RevenueDataPoint {
  month: string
  revenue: number
}

export interface MembershipPlanCount {
  plan: string
  count: number
}

export interface AttendanceSnapshot {
  checkedIn: number
  peakHour: string
  currentlyInside: number
}

export interface ExpiringMembership {
  id: string
  memberName: string
  plan: string
  expiresIn: number
  expiryLabel: string
}

export interface RecentPayment {
  receiptId: string
  memberName: string
  amount: number
  method: 'UPI' | 'Cash' | 'Card' | 'Net Banking'
  date: string
}

export interface DashboardData {
  stats: DashboardStats
  revenueData: RevenueDataPoint[]
  membershipDistribution: MembershipPlanCount[]
  attendanceSnapshot: AttendanceSnapshot
  expiringMemberships: ExpiringMembership[]
  recentPayments: RecentPayment[]
}
