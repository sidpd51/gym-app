import { apiClient } from '@/lib/api'
import type {
  SearchResultType,
  SearchGroup,
  SearchPermissions,
  GlobalSearchResult,
} from '../types/search.types'

// Backend search response (internal/modules/search/search.go).
export interface BackendSearchResponse {
  Members: Array<{
    ID: string
    MemberCode: string
    FirstName: string
    LastName: string
    Phone: string
  }>
  Trainers: Array<{
    ID: string
    TrainerCode: string
    FirstName: string
    LastName: string
    Phone: string
  }>
  Leads: Array<{
    ID: string
    LeadCode: string
    Name: string
    Phone: string
  }>
}

// Map backend members to frontend GlobalSearchResult.
function mapBackendMember(payload: BackendSearchResponse['Members'][0]): GlobalSearchResult {
  return {
    id: payload.ID,
    title: `${payload.FirstName} ${payload.LastName}`,
    subtitle: `${payload.MemberCode} ${payload.Phone}`,
    to: `/members/${payload.ID}`,
    type: 'members' as SearchResultType,
  }
}

function mapBackendTrainer(payload: BackendSearchResponse['Trainers'][0]): GlobalSearchResult {
  return {
    id: payload.ID,
    title: `${payload.FirstName} ${payload.LastName}`,
    subtitle: `${payload.TrainerCode} ${payload.Phone}`,
    to: `/trainers/${payload.ID}`,
    type: 'trainers' as SearchResultType,
  }
}

function mapBackendLead(payload: BackendSearchResponse['Leads'][0]): GlobalSearchResult {
  return {
    id: payload.ID,
    title: payload.Name,
    subtitle: `${payload.LeadCode} ${payload.Phone}`,
    to: `/leads/${payload.ID}`,
    type: 'leads' as SearchResultType,
  }
}

// Fetch search results from the backend API.
// The backend endpoint GET /api/v1/search?q=<query> returns Members, Trainers, Leads
// based on the user's permissions and roles.
export async function fetchSearchResults(
  query: string,
): Promise<{
  members: GlobalSearchResult[]
  trainers: GlobalSearchResult[]
  leads: GlobalSearchResult[]
}> {
  const res = await apiClient.get<BackendSearchResponse>(`/api/v1/search?q=${query}`)
  const members = (res.Members || []).map(mapBackendMember)
  const trainers = (res.Trainers || []).map(mapBackendTrainer)
  const leads = (res.Leads || []).map(mapBackendLead)
  return { members, trainers, leads }
}

const EMPTY_SEARCH_GROUPS: Partial<Record<SearchResultType, SearchGroup>> = Object.freeze({})

// Search the live backend and return grouped results respecting permissions.
export async function searchLive(
  query: string,
  permissions: SearchPermissions,
): Promise<Partial<Record<SearchResultType, SearchGroup>>> {
  const q = query.trim().toLowerCase()
  if (!q) return EMPTY_SEARCH_GROUPS

  const { members, trainers, leads } = await fetchSearchResults(q)

  const groups: Partial<Record<SearchResultType, SearchGroup>> = {}

  // Members
  if (permissions.members && members.length > 0) {
    groups['members'] = {
      label: 'Members',
      results: members,
    }
  }

  // Trainers
  if (permissions.trainers && trainers.length > 0) {
    groups['trainers'] = {
      label: 'Trainers',
      results: trainers,
    }
  }

  // Leads
  if (permissions.leads && leads.length > 0) {
    groups['leads'] = {
      label: 'Leads',
      results: leads,
    }
  }

  return groups
}

/**
 * Backward-compatible wrapper: uses the live backend API.
 * Kept for components that still import `searchAll`.
 */
export async function searchAll(
  query: string,
  permissions: SearchPermissions,
): Promise<Partial<Record<SearchResultType, SearchGroup>>> {
  return searchLive(query, permissions)
}