export type MembershipPlanStatus = 'ACTIVE' | 'INACTIVE'

export interface MembershipPlan {
  id: string
  name: string
  description?: string
  durationInDays: number
  price: number
  status: MembershipPlanStatus
  createdAt: string
}
