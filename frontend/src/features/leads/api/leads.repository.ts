import { apiClient } from '@/lib/api'
import type { ListQueryParams, PaginatedResponse } from '@/lib/api'
import type { Lead, LeadSource, LeadStatus } from '../types/lead.types'
import { leadsMockData } from '../data/leads.mock'

// Backend lead Response (internal/modules/lead/lead.go).
export interface BackendLead {
  id: string
  leadCode: string
  name: string
  phone: string
  email: string | null
  source: LeadSource | null
  interestedPlanId: string | null
  status: LeadStatus
  notes: string | null
  lastFollowUpDate: string | null
  nextFollowUpDate: string | null
  createdAt: string
  convertedMemberId: string | null
}

export function mapBackendLead(payload: BackendLead): Lead {
  return {
    id: payload.id,
    leadCode: payload.leadCode,
    name: payload.name,
    phone: payload.phone,
    email: payload.email ?? undefined,
    source: payload.source ?? undefined,
    interestedPlanId: payload.interestedPlanId ?? undefined,
    status: payload.status,
    notes: payload.notes ?? undefined,
    lastFollowUpDate: payload.lastFollowUpDate ?? undefined,
    nextFollowUpDate: payload.nextFollowUpDate ?? undefined,
    createdAt: payload.createdAt,
    convertedMemberId: payload.convertedMemberId ?? undefined,
  }
}

export interface LeadListQuery extends ListQueryParams {
  status?: LeadStatus
}

export interface CreateLeadInput {
  name: string
  phone: string
  email?: string
  source?: LeadSource
  interestedPlanId?: string
  notes?: string
  nextFollowUpDate?: string
}

export interface UpdateLeadInput {
  name?: string
  phone?: string
  email?: string
  source?: LeadSource
  interestedPlanId?: string
  status?: LeadStatus
  notes?: string
  lastFollowUpDate?: string
  nextFollowUpDate?: string
}

export interface ConvertLeadInput {
  firstName: string
  lastName: string
  joiningDate: string
  phone: string
}

export interface LeadRepository {
  list(query?: LeadListQuery, signal?: AbortSignal): Promise<PaginatedResponse<Lead>>
  getById(id: string, signal?: AbortSignal): Promise<Lead>
  create(input: CreateLeadInput): Promise<Lead>
  update(id: string, input: UpdateLeadInput): Promise<Lead>
  remove(id: string): Promise<void>
  // Returns the id of the newly created member; lead becomes CONVERTED.
  convert(id: string, input: ConvertLeadInput): Promise<string>
}

function toQuery(query?: LeadListQuery): ListQueryParams {
  return {
    page: query?.page ?? 1,
    pageSize: query?.pageSize ?? 100,
    status: query?.status,
  }
}

export const apiLeadRepository: LeadRepository = {
  async list(query?: LeadListQuery, signal?: AbortSignal): Promise<PaginatedResponse<Lead>> {
    const res = await apiClient.get<PaginatedResponse<BackendLead>>('/api/v1/leads', toQuery(query), { signal })
    return {
      meta: res.meta,
      data: res.data.map(mapBackendLead),
    }
  },

  async getById(id: string, signal?: AbortSignal): Promise<Lead> {
    const res = await apiClient.get<BackendLead>(`/api/v1/leads/${id}`, undefined, { signal })
    return mapBackendLead(res)
  },

  async create(input: CreateLeadInput): Promise<Lead> {
    const res = await apiClient.post<BackendLead>('/api/v1/leads', {
      name: input.name,
      phone: input.phone,
      email: input.email || undefined,
      source: input.source,
      interestedPlanId: input.interestedPlanId || undefined,
      notes: input.notes || undefined,
      nextFollowUpDate: input.nextFollowUpDate || undefined,
    })
    return mapBackendLead(res)
  },

  async update(id: string, input: UpdateLeadInput): Promise<Lead> {
    const res = await apiClient.patch<BackendLead>(`/api/v1/leads/${id}`, input)
    return mapBackendLead(res)
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete<void>(`/api/v1/leads/${id}`)
  },

  async convert(id: string, input: ConvertLeadInput): Promise<string> {
    const res = await apiClient.post<{ memberId: string }>(`/api/v1/leads/${id}/convert`, {
      firstName: input.firstName,
      lastName: input.lastName,
      joiningDate: input.joiningDate,
      phone: input.phone,
    })
    return res.memberId
  },
}

// Kept for unit tests / offline reference. No longer the default.
export const mockLeadRepository = {
  list: (): Lead[] => leadsMockData,
  getById: (id: string): Lead | undefined => leadsMockData.find((l) => l.id === id),
}

export const leadRepository: LeadRepository = apiLeadRepository
