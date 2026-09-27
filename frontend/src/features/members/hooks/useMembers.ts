import { memberRepository } from '../api/members.repository'
import type { Member, MemberSupplementalData } from '../types/member.types'

export function useMembers(): { members: Member[] } {
  return { members: memberRepository.list() }
}

export function useMember(id: string | undefined): {
  member: Member | undefined
  supplementalData: MemberSupplementalData | undefined
} {
  return {
    member: id ? memberRepository.getById(id) : undefined,
    supplementalData: id ? memberRepository.getSupplementalData(id) : undefined,
  }
}
