export type MemberStatus = 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED'

export type MembershipPlan = 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Annual'

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
}
