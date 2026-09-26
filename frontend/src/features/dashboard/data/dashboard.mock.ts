import type { DashboardData } from '../types/dashboard.types'

export const dashboardMockData: DashboardData = {
  stats: {
    totalMembers: 1248,
    activeMembers: 1102,
    expiringMemberships: 32,
    todayAttendance: 187,
  },
  revenueData: [
    { month: 'Apr', revenue: 142000 },
    { month: 'May', revenue: 158000 },
    { month: 'Jun', revenue: 171000 },
    { month: 'Jul', revenue: 165000 },
    { month: 'Aug', revenue: 182000 },
    { month: 'Sep', revenue: 194000 },
  ],
  membershipDistribution: [
    { plan: 'Monthly', count: 420 },
    { plan: 'Quarterly', count: 280 },
    { plan: 'Half-Yearly', count: 190 },
    { plan: 'Annual', count: 212 },
  ],
  attendanceSnapshot: {
    checkedIn: 187,
    peakHour: '06:00 PM – 07:00 PM',
    currentlyInside: 42,
  },
  expiringMemberships: [
    { id: 'em-1', memberName: 'Rahul Kumar', plan: 'Monthly', expiresIn: 1, expiryLabel: 'Tomorrow' },
    { id: 'em-2', memberName: 'Amit Singh', plan: 'Annual', expiresIn: 3, expiryLabel: '3 days' },
    { id: 'em-3', memberName: 'Rohit Das', plan: 'Quarterly', expiresIn: 5, expiryLabel: '5 days' },
    { id: 'em-4', memberName: 'Priya Sharma', plan: 'Monthly', expiresIn: 7, expiryLabel: '7 days' },
  ],
  recentPayments: [
    { receiptId: 'R-1024', memberName: 'Rahul Kumar', amount: 1500, method: 'UPI', date: 'Today' },
    { receiptId: 'R-1023', memberName: 'Amit Singh', amount: 12000, method: 'Cash', date: 'Today' },
    { receiptId: 'R-1022', memberName: 'Priya Sharma', amount: 4000, method: 'UPI', date: 'Yesterday' },
    { receiptId: 'R-1021', memberName: 'Rohit Das', amount: 6000, method: 'Card', date: 'Yesterday' },
  ],
}
