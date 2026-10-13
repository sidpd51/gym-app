import { useApiDetail, useApiList } from '@/lib/api/useApi'
import type { ApiError, PaginatedResponse } from '@/lib/api'
import { membershipPlanRepository, type PlanListQuery } from '../api/membership-plans.repository'
import type { MembershipPlan } from '../types/membership-plan.types'

interface PlansResult {
  plans: MembershipPlan[]
  meta: PaginatedResponse<MembershipPlan>['meta'] | null
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

/**
 * Async plan list backed by GET /api/v1/membership-plans.
 * `plans` defaults to [] while loading so existing cross-feature consumers
 * (leads, memberships) keep working during fetch.
 */
export function useMembershipPlans(query?: PlanListQuery): PlansResult {
  const normalized: PlanListQuery = {
    page: 1,
    pageSize: 100,
    ...query,
  }
  const { data, meta, isLoading, error, refetch } = useApiList<MembershipPlan>(normalized, (q) =>
    membershipPlanRepository.list(q as PlanListQuery),
  )
  return { plans: data ?? [], meta, isLoading, error, refetch }
}

interface PlanResult {
  plan: MembershipPlan | null
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

/** Async plan detail backed by GET /api/v1/membership-plans/{id}. */
export function useMembershipPlan(id: string | undefined): PlanResult {
  const { data, isLoading, error, refetch } = useApiDetail<MembershipPlan>(id, (planId) =>
    membershipPlanRepository.getById(planId),
  )
  return { plan: data, isLoading, error, refetch }
}
