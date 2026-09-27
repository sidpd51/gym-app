export type SearchResultType =
  | 'members'
  | 'membershipPlans'
  | 'memberships'
  | 'payments'
  | 'trainers'
  | 'leads'
  | 'expenses'
  | 'inventory'
  | 'equipment'

export interface GlobalSearchResult {
  id: string
  title: string
  subtitle: string
  to: string
  type: SearchResultType
}

export interface SearchGroup {
  label: string
  results: GlobalSearchResult[]
}

export interface SearchPermissions {
  members: boolean
  membershipPlans: boolean
  memberships: boolean
  payments: boolean
  trainers: boolean
  leads: boolean
  expenses: boolean
  inventory: boolean
  equipment: boolean
}
