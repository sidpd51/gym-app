import { useApiDetail, useApiList } from '@/lib/api/useApi'
import type { ApiError, PaginatedResponse } from '@/lib/api'
import { leadRepository, type LeadListQuery } from '../api/leads.repository'
import type { Lead } from '../types/lead.types'

interface LeadsResult {
  leads: Lead[]
  meta: PaginatedResponse<Lead>['meta'] | null
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

/**
 * Async lead list backed by GET /api/v1/leads.
 * `leads` defaults to [] while loading so existing cross-feature
 * consumers (reports, search) keep working during fetch.
 */
export function useLeads(query?: LeadListQuery): LeadsResult {
  const normalized: LeadListQuery = {
    page: 1,
    pageSize: 100,
    ...query,
  }
  const { data, meta, isLoading, error, refetch } = useApiList<Lead>(normalized, (q, signal) =>
    leadRepository.list(q as LeadListQuery, signal),
  )
  return { leads: data ?? [], meta, isLoading, error, refetch }
}

interface LeadResult {
  lead: Lead | null
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

/** Async lead detail backed by GET /api/v1/leads/{id}. */
export function useLead(id: string | undefined): LeadResult {
  const { data, isLoading, error, refetch } = useApiDetail<Lead>(id, (leadId, signal) =>
    leadRepository.getById(leadId, signal),
  )
  return { lead: data, isLoading, error, refetch }
}
