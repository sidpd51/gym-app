export type MemberStatus = 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED'

export type MembershipPlan = 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Annual'

export type Gender = 'Male' | 'Female' | 'Other'

export interface Member {
  id: string
  memberCode: string
  firstName: string
  lastName: string
  phone: string
  email?: string
  status: MemberStatus
  membershipPlan?: MembershipPlan
  membershipEndDate?: string
  trainerName?: string
  joiningDate: string
  // Extended for member details
  dateOfBirth?: string
  gender?: Gender
  address?: string
  emergencyContact?: string
}

// ── Member details types ────────────────────────────────────────────

export interface MembershipHistoryItem {
  id: string
  plan: MembershipPlan
  startDate: string
  endDate: string
  amount: number
  status: MemberStatus
}

export interface MemberAttendanceSummaryData {
  visitsThisMonth: number
  lastVisitDate: string | null
  averageVisitsPerWeek: number
}

export interface MemberPaymentRecord {
  receiptId: string
  plan: MembershipPlan
  amount: number
  method: string
  date: string
}

export interface MemberSupplementalData {
  membershipHistory: MembershipHistoryItem[]
  attendanceSummary: MemberAttendanceSummaryData
  paymentHistory: MemberPaymentRecord[]
}
