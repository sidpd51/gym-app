import { membershipRepository } from '../api/memberships.repository'
import type { Membership } from '../types/membership.types'

export function useMemberships(): { memberships: Membership[] } {
  return { memberships: membershipRepository.list() }
}

export function useMembership(id: string | undefined): { membership: Membership | undefined } {
  return { membership: id ? membershipRepository.getById(id) : undefined }
}

export function useMemberMemberships(memberId: string | undefined): { memberships: Membership[] } {
  return { memberships: memberId ? membershipRepository.listByMemberId(memberId) : [] }
}
