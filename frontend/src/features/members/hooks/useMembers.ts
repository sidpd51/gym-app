import { useApiDetail, useApiList } from '@/lib/api/useApi'
import type { ApiError, PaginatedResponse } from '@/lib/api'
import { memberRepository, type MemberListQuery } from '../api/members.repository'
import type { Member, MemberSupplementalData } from '../types/member.types'

interface MembersResult {
  members: Member[]
  meta: PaginatedResponse<Member>['meta'] | null
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

/**
 * Async member list backed by GET /api/v1/members.
 * `members` defaults to [] while loading so existing cross-feature
 * consumers (reports, search, dashboards) keep working during fetch.
 */
export function useMembers(query?: MemberListQuery): MembersResult {
  const normalized: MemberListQuery = {
    page: 1,
    pageSize: 100,
    ...query,
  }
  const { data, meta, isLoading, error, refetch } = useApiList<Member>(normalized, (q) =>
    memberRepository.list(q as MemberListQuery),
  )
  return { members: data ?? [], meta, isLoading, error, refetch }
}

interface MemberResult {
  member: Member | null
  supplementalData: MemberSupplementalData | null
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

/**
 * Async member detail backed by GET /api/v1/members/{id}/details.
 * `supplementalData` is derived from the details endpoint; backend
 * currently returns empty slices (later phases populate them), so
 * empty defaults keep the detail UI stable until then.
 */
export function useMember(id: string | undefined): MemberResult {
  const { data, isLoading, error, refetch } = useApiDetail<{
    member: Member
    details: {
      membershipHistory: unknown[]
      paymentHistory: unknown[]
      attendanceHistory: unknown[]
      activeTrainer: unknown
    }
  }>(id, (memberId) => memberRepository.getDetails(memberId))

  const supplementalData: MemberSupplementalData | null = data
    ? {
        membershipHistory: data.details.membershipHistory as MemberSupplementalData['membershipHistory'],
        attendanceSummary: {
          visitsThisMonth: 0,
          lastVisitDate: null,
          averageVisitsPerWeek: 0,
        },
        paymentHistory: data.details.paymentHistory as MemberSupplementalData['paymentHistory'],
      }
    : null

  return { member: data?.member ?? null, supplementalData, isLoading, error, refetch }
}
