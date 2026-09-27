import { leadRepository } from '../api/leads.repository'
import type { Lead } from '../types/lead.types'

export function useLeads(): { leads: Lead[] } {
  return { leads: leadRepository.list() }
}

export function useLead(id: string | undefined): { lead: Lead | undefined } {
  return { lead: id ? leadRepository.getById(id) : undefined }
}
