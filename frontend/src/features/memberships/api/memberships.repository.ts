import type { Membership } from '../types/membership.types'
import { membershipsMockData } from '../data/memberships.mock'

export interface MembershipRepository {
  list(): Membership[]
  getById(id: string): Membership | undefined
  listByMemberId(memberId: string): Membership[]
}

export const mockMembershipRepository: MembershipRepository = {
  list: () => membershipsMockData,
  getById: (id) => membershipsMockData.find((item) => item.id === id),
  listByMemberId: (memberId) => membershipsMockData.filter((ms) => ms.memberId === memberId),
}

export const membershipRepository: MembershipRepository = mockMembershipRepository
