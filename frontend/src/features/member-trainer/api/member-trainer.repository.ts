import { apiClient } from '@/lib/api'
import { ApiError } from '@/lib/api'
import type { MemberTrainerAssignment } from '../types/member-trainer.types'
import { memberTrainerAssignmentsMockData } from '../data/member-trainer-assignments.mock'

// Backend AssignmentResponse (internal/modules/trainer/trainer.go).
// NOTE: the backend currently exposes only the *current* assignment
// (GET /members/{memberId}/trainer). There is no history-list endpoint
// yet, so listByMemberId returns the active assignment (or [] when none).
export interface BackendAssignment {
  id: string
  memberId: string
  trainerId: string
  startDate: string
  endDate: string | null
  status: 'ACTIVE' | 'ENDED'
  createdAt: string
}

export function mapBackendAssignment(payload: BackendAssignment): MemberTrainerAssignment {
  return {
    id: payload.id,
    memberId: payload.memberId,
    trainerId: payload.trainerId,
    startDate: payload.startDate,
    endDate: payload.endDate ?? undefined,
    status: payload.status,
  }
}

export interface MemberTrainerRepository {
  listByMemberId(memberId: string, signal?: AbortSignal): Promise<MemberTrainerAssignment[]>
  getCurrentForMember(memberId: string, signal?: AbortSignal): Promise<MemberTrainerAssignment | null>
  assign(memberId: string, trainerId: string): Promise<MemberTrainerAssignment>
  endCurrent(memberId: string): Promise<void>
}

export const apiMemberTrainerRepository: MemberTrainerRepository = {
  async listByMemberId(memberId: string, signal?: AbortSignal): Promise<MemberTrainerAssignment[]> {
    try {
      const res = await apiClient.get<BackendAssignment>(`/api/v1/members/${memberId}/trainer`, undefined, { signal })
      return [mapBackendAssignment(res)]
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return []
      throw err
    }
  },

  async getCurrentForMember(memberId: string, signal?: AbortSignal): Promise<MemberTrainerAssignment | null> {
    try {
      const res = await apiClient.get<BackendAssignment>(`/api/v1/members/${memberId}/trainer`, undefined, { signal })
      return mapBackendAssignment(res)
    } catch (err) {
      // 404 ASSIGNMENT_NOT_FOUND is a normal "no trainer" state.
      if (err instanceof ApiError && err.status === 404) return null
      throw err
    }
  },

  // Backend ends any active assignment first, then creates the new one.
  async assign(memberId: string, trainerId: string): Promise<MemberTrainerAssignment> {
    const res = await apiClient.post<BackendAssignment>(`/api/v1/members/${memberId}/trainer`, {
      trainerId,
    })
    return mapBackendAssignment(res)
  },

  async endCurrent(memberId: string): Promise<void> {
    await apiClient.delete<void>(`/api/v1/members/${memberId}/trainer`)
  },
}

// Kept for unit tests / offline reference. No longer the default.
export const mockMemberTrainerRepository = {
  listByMemberId: (memberId: string): MemberTrainerAssignment[] =>
    memberTrainerAssignmentsMockData.filter((item) => item.memberId === memberId),
}

export const memberTrainerRepository: MemberTrainerRepository = apiMemberTrainerRepository
