export type MembershipStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED'

export interface Membership {
  id: string
  memberId: string
  planId: string
  planName: string
  startDate: string
  endDate: string
  amount: number
  status: MembershipStatus
}
