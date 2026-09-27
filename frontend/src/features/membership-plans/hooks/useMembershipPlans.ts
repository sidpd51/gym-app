import { membershipPlanRepository } from '../api/membership-plans.repository'
import type { MembershipPlan } from '../types/membership-plan.types'

export function useMembershipPlans(): { plans: MembershipPlan[] } {
  return { plans: membershipPlanRepository.list() }
}

export function useMembershipPlan(id: string | undefined): { plan: MembershipPlan | undefined } {
  return { plan: id ? membershipPlanRepository.getById(id) : undefined }
}
