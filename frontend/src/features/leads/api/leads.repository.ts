import type { Lead } from '../types/lead.types'
import { leadsMockData } from '../data/leads.mock'

export interface LeadRepository {
  list(): Lead[]
  getById(id: string): Lead | undefined
}

export const mockLeadRepository: LeadRepository = {
  list: () => leadsMockData,
  getById: (id) => leadsMockData.find((item) => item.id === id),
}

export const leadRepository: LeadRepository = mockLeadRepository
