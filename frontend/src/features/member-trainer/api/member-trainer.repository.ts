import type { MemberTrainerAssignment } from '../types/member-trainer.types'
import { memberTrainerAssignmentsMockData } from '../data/member-trainer-assignments.mock'

export interface MemberTrainerRepository {
  listByMemberId(memberId: string): MemberTrainerAssignment[]
}

export const mockMemberTrainerRepository: MemberTrainerRepository = {
  listByMemberId: (memberId) =>
    memberTrainerAssignmentsMockData.filter((item) => item.memberId === memberId),
}

export const memberTrainerRepository: MemberTrainerRepository = mockMemberTrainerRepository
