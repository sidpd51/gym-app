import { apiClient } from '@/lib/api'
import type { ListQueryParams, PaginatedResponse } from '@/lib/api'
import type { Membership, MembershipStatus } from '../types/membership.types'
import { membershipsMockData } from '../data/memberships.mock'

// Backend membership Response (internal/modules/membership/dto.go).
// shopspring/decimal serializes as a JSON string; accept number too.
export interface BackendMembership {
  id: string
  memberId: string
  planId: string
  planName: string
  startDate: string
  endDate: string
  amount: number | string
  status: MembershipStatus
  createdAt: string
}

export function mapBackendMembership(payload: BackendMembership): Membership {
  return {
    id: payload.id,
    memberId: payload.memberId,
    planId: payload.planId,
    planName: payload.planName,
    startDate: payload.startDate,
    endDate: payload.endDate,
    amount: Number(payload.amount),
    status: payload.status,
  }
}

export interface MembershipListQuery extends ListQueryParams {
  status?: MembershipStatus
  memberId?: string
}

export interface CreateMembershipInput {
  memberId: string
  planId: string
  startDate: string
}

export interface MembershipRepository {
  list(query?: MembershipListQuery): Promise<PaginatedResponse<Membership>>
  getById(id: string): Promise<Membership>
  listByMemberId(memberId: string): Promise<Membership[]>
  create(input: CreateMembershipInput): Promise<Membership>
}

function toQuery(query?: MembershipListQuery): ListQueryParams {
  return {
    page: query?.page ?? 1,
    pageSize: query?.pageSize ?? 100,
    status: query?.status,
    memberId: query?.memberId,
  }
}

export const apiMembershipRepository: MembershipRepository = {
  async list(query?: MembershipListQuery): Promise<PaginatedResponse<Membership>> {
    const res = await apiClient.get<PaginatedResponse<BackendMembership>>(
      '/api/v1/memberships',
      toQuery(query),
    )
    return {
      meta: res.meta,
      data: res.data.map(mapBackendMembership),
    }
  },

  async getById(id: string): Promise<Membership> {
    const res = await apiClient.get<BackendMembership>(`/api/v1/memberships/${id}`)
    return mapBackendMembership(res)
  },

  async listByMemberId(memberId: string): Promise<Membership[]> {
    const res = await apiClient.get<PaginatedResponse<BackendMembership>>(
      '/api/v1/memberships',
      { page: 1, pageSize: 100, memberId },
    )
    return res.data.map(mapBackendMembership)
  },

  async create(input: CreateMembershipInput): Promise<Membership> {
    const res = await apiClient.post<BackendMembership>('/api/v1/memberships', {
      memberId: input.memberId,
      planId: input.planId,
      startDate: input.startDate,
    })
    return mapBackendMembership(res)
  },
}

// Kept for unit tests / offline reference. No longer the default.
export const mockMembershipRepository = {
  list: (): Membership[] => membershipsMockData,
  getById: (id: string): Membership | undefined =>
    membershipsMockData.find((item) => item.id === id),
  listByMemberId: (memberId: string): Membership[] =>
    membershipsMockData.filter((ms) => ms.memberId === memberId),
}

export const membershipRepository: MembershipRepository = apiMembershipRepository
