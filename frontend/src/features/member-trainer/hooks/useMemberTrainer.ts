import { memberTrainerRepository } from '../api/member-trainer.repository'
import type { MemberTrainerAssignment } from '../types/member-trainer.types'

export function useMemberTrainer(memberId: string | undefined): {
  assignments: MemberTrainerAssignment[]
  currentAssignment: MemberTrainerAssignment | undefined
} {
  const assignments = memberId
    ? memberTrainerRepository.listByMemberId(memberId)
    : []
  const currentAssignment = assignments.find((a) => a.status === 'ACTIVE')
  return { assignments, currentAssignment }
}
