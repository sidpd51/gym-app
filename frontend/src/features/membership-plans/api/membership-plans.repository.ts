import type { MembershipPlan } from '../types/membership-plan.types'
import { membershipPlansMockData } from '../data/membership-plans.mock'

export interface MembershipPlanRepository {
  list(): MembershipPlan[]
  getById(id: string): MembershipPlan | undefined
}

export const mockMembershipPlanRepository: MembershipPlanRepository = {
  list: () => membershipPlansMockData,
  getById: (id) => membershipPlansMockData.find((item) => item.id === id),
}

export const membershipPlanRepository: MembershipPlanRepository = mockMembershipPlanRepository
