export type AssignmentStatus = 'ACTIVE' | 'ENDED'

export interface MemberTrainerAssignment {
  id: string
  memberId: string
  trainerId: string
  startDate: string
  endDate?: string
  status: AssignmentStatus
}
