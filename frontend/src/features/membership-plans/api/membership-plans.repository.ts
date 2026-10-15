import { apiClient } from '@/lib/api'
import type { ListQueryParams, PaginatedResponse } from '@/lib/api'
import type { MembershipPlan, MembershipPlanStatus } from '../types/membership-plan.types'
import { membershipPlansMockData } from '../data/membership-plans.mock'

// Backend plan Response (internal/modules/plan/dto.go).
// shopspring/decimal serializes as a JSON number, but accept strings too.
export interface BackendPlan {
  id: string
  name: string
  description: string | null
  durationInDays: number
  price: number | string
  status: MembershipPlanStatus
  createdAt: string
}

export function mapBackendPlan(payload: BackendPlan): MembershipPlan {
  return {
    id: payload.id,
    name: payload.name,
    description: payload.description ?? undefined,
    durationInDays: Number(payload.durationInDays),
    price: Number(payload.price),
    status: payload.status,
    createdAt: payload.createdAt,
  }
}

export interface PlanListQuery extends ListQueryParams {
  status?: MembershipPlanStatus
}

export interface CreatePlanInput {
  name: string
  description?: string
  durationInDays: number
  price: number
  status?: MembershipPlanStatus
}

export interface UpdatePlanInput {
  name?: string
  description?: string
  durationInDays?: number
  price?: number
  status?: MembershipPlanStatus
}

export interface MembershipPlanRepository {
  list(query?: PlanListQuery, signal?: AbortSignal): Promise<PaginatedResponse<MembershipPlan>>
  getById(id: string, signal?: AbortSignal): Promise<MembershipPlan>
  create(input: CreatePlanInput): Promise<MembershipPlan>
  update(id: string, input: UpdatePlanInput): Promise<MembershipPlan>
  remove(id: string): Promise<void>
}

function toQuery(query?: PlanListQuery): ListQueryParams {
  return {
    page: query?.page ?? 1,
    pageSize: query?.pageSize ?? 100,
    status: query?.status,
    search: query?.search,
  }
}

export const apiMembershipPlanRepository: MembershipPlanRepository = {
  async list(query?: PlanListQuery, signal?: AbortSignal): Promise<PaginatedResponse<MembershipPlan>> {
    const res = await apiClient.get<PaginatedResponse<BackendPlan>>(
      '/api/v1/membership-plans',
      toQuery(query),
      { signal },
    )
    return {
      meta: res.meta,
      data: res.data.map(mapBackendPlan),
    }
  },

  async getById(id: string, signal?: AbortSignal): Promise<MembershipPlan> {
    const res = await apiClient.get<BackendPlan>(`/api/v1/membership-plans/${id}`, undefined, { signal })
    return mapBackendPlan(res)
  },

  async create(input: CreatePlanInput): Promise<MembershipPlan> {
    const res = await apiClient.post<BackendPlan>('/api/v1/membership-plans', {
      name: input.name,
      description: input.description || undefined,
      durationInDays: input.durationInDays,
      price: input.price,
      status: input.status,
    })
    return mapBackendPlan(res)
  },

  async update(id: string, input: UpdatePlanInput): Promise<MembershipPlan> {
    const res = await apiClient.patch<BackendPlan>(`/api/v1/membership-plans/${id}`, input)
    return mapBackendPlan(res)
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete<void>(`/api/v1/membership-plans/${id}`)
  },
}

// Kept for unit tests / offline reference. No longer the default.
export const mockMembershipPlanRepository = {
  list: (): MembershipPlan[] => membershipPlansMockData,
  getById: (id: string): MembershipPlan | undefined =>
    membershipPlansMockData.find((item) => item.id === id),
}

export const membershipPlanRepository: MembershipPlanRepository = apiMembershipPlanRepository
