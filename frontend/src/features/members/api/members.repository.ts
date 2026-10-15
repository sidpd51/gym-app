import { apiClient } from '@/lib/api'
import type { ListQueryParams, PaginatedResponse } from '@/lib/api'
import type {
  Gender,
  Member,
  MemberStatus,
} from '../types/member.types'
import { membersMockData } from '../data/members.mock'

// Backend MemberResponse (internal/modules/member/dto.go).
// Nullable pointers map to undefined; membershipPlan/membershipEndDate/
// trainerName are UI-only fields not returned by the backend (yet).
export interface BackendMember {
  id: string
  memberCode: string
  firstName: string
  lastName: string
  phone: string
  email: string | null
  status: MemberStatus
  joiningDate: string
  dateOfBirth: string | null
  gender: string | null
  address: string | null
  emergencyContactName: string | null
  emergencyContactPhone: string | null
  emergencyContactRelationship: string | null
  createdAt: string
  updatedAt: string
}

export function mapBackendMember(payload: BackendMember): Member {
  return {
    id: payload.id,
    memberCode: payload.memberCode,
    firstName: payload.firstName,
    lastName: payload.lastName,
    phone: payload.phone,
    email: payload.email ?? undefined,
    status: payload.status,
    joiningDate: payload.joiningDate,
    dateOfBirth: payload.dateOfBirth ?? undefined,
    gender: (payload.gender as Gender | null) ?? undefined,
    address: payload.address ?? undefined,
  }
}

// Backend MemberDetail (GET /members/{id}/details). Supplemental
// slices are populated in later backend phases; components already
// handle empty arrays.
export interface BackendMemberDetails {
  member: BackendMember
  membershipHistory: unknown[]
  paymentHistory: unknown[]
  attendanceHistory: unknown[]
  activeTrainer: unknown
}

export interface MemberListQuery extends ListQueryParams {
  status?: MemberStatus
}

export interface CreateMemberInput {
  firstName: string
  lastName: string
  phone: string
  email?: string
  joiningDate: string
  dateOfBirth?: string
  gender?: string
  address?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  emergencyContactRelationship?: string
}

export interface UpdateMemberInput {
  firstName?: string
  lastName?: string
  email?: string
  status?: MemberStatus
  dateOfBirth?: string
  gender?: string
  address?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  emergencyContactRelationship?: string
}

export interface MemberRepository {
  list(query?: MemberListQuery, signal?: AbortSignal): Promise<PaginatedResponse<Member>>
  getById(id: string, signal?: AbortSignal): Promise<Member>
  getDetails(id: string, signal?: AbortSignal): Promise<{
    member: Member
    details: BackendMemberDetails
  }>
  create(input: CreateMemberInput): Promise<Member>
  update(id: string, input: UpdateMemberInput): Promise<Member>
  remove(id: string): Promise<void>
}

function toQuery(query?: MemberListQuery): ListQueryParams {
  return {
    page: query?.page ?? 1,
    pageSize: query?.pageSize ?? 100,
    status: query?.status,
    search: query?.search,
  }
}

export const apiMemberRepository: MemberRepository = {
  async list(query?: MemberListQuery, signal?: AbortSignal): Promise<PaginatedResponse<Member>> {
    const res = await apiClient.get<PaginatedResponse<BackendMember>>(
      '/api/v1/members',
      toQuery(query),
      { signal },
    )
    return {
      meta: res.meta,
      data: res.data.map(mapBackendMember),
    }
  },

  async getById(id: string, signal?: AbortSignal): Promise<Member> {
    const res = await apiClient.get<BackendMember>(`/api/v1/members/${id}`, undefined, { signal })
    return mapBackendMember(res)
  },

  async getDetails(id: string, signal?: AbortSignal) {
    const res = await apiClient.get<BackendMemberDetails>(
      `/api/v1/members/${id}/details`,
      undefined,
      { signal },
    )
    return { member: mapBackendMember(res.member), details: res }
  },

  async create(input: CreateMemberInput): Promise<Member> {
    const res = await apiClient.post<BackendMember>('/api/v1/members', {
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      email: input.email || undefined,
      joiningDate: input.joiningDate,
      dateOfBirth: input.dateOfBirth || undefined,
      gender: input.gender || undefined,
      address: input.address || undefined,
      emergencyContactName: input.emergencyContactName || undefined,
      emergencyContactPhone: input.emergencyContactPhone || undefined,
      emergencyContactRelationship: input.emergencyContactRelationship || undefined,
    })
    return mapBackendMember(res)
  },

  async update(id: string, input: UpdateMemberInput): Promise<Member> {
    const res = await apiClient.patch<BackendMember>(`/api/v1/members/${id}`, input)
    return mapBackendMember(res)
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete<void>(`/api/v1/members/${id}`)
  },
}

// Kept for unit tests / offline reference. No longer the default.
export const mockMemberRepository = {
  list: (): Member[] => membersMockData,
  getById: (id: string): Member | undefined =>
    membersMockData.find((item) => item.id === id),
}

export const memberRepository: MemberRepository = apiMemberRepository
