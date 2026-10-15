import { useApiQuery } from '@/lib/api/useApi'
import type { ApiError } from '@/lib/api'
import { memberTrainerRepository } from '../api/member-trainer.repository'
import type { MemberTrainerAssignment } from '../types/member-trainer.types'

interface MemberTrainerResult {
  assignments: MemberTrainerAssignment[]
  currentAssignment: MemberTrainerAssignment | null
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

/**
 * Async member-trainer data backed by GET /api/v1/members/{id}/trainer.
 * Backend currently returns only the active assignment (no history
 * endpoint yet), so `assignments` holds at most one item until the
 * backend adds a history list.
 */
export function useMemberTrainer(memberId: string | undefined): MemberTrainerResult {
  const { data, isLoading, error, refetch } = useApiQuery<MemberTrainerAssignment | null>(
    (signal) => (memberId ? memberTrainerRepository.getCurrentForMember(memberId, signal) : Promise.resolve(null)),
    memberId ?? '',
  )
  return {
    assignments: data ? [data] : [],
    currentAssignment: data,
    isLoading,
    error,
    refetch,
  }
}
