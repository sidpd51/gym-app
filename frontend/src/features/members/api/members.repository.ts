import type { Member, MemberSupplementalData } from '../types/member.types'
import { membersMockData } from '../data/members.mock'
import { memberSupplementalData } from '../data/member-details.mock'

export interface MemberRepository {
  list(): Member[]
  getById(id: string): Member | undefined
  getSupplementalData(memberId: string): MemberSupplementalData | undefined
}

export const mockMemberRepository: MemberRepository = {
  list: () => membersMockData,
  getById: (id) => membersMockData.find((item) => item.id === id),
  getSupplementalData: (memberId) => memberSupplementalData[memberId],
}

export const memberRepository: MemberRepository = mockMemberRepository
