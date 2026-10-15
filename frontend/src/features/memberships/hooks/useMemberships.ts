import { useApiDetail, useApiList, useApiQuery } from '@/lib/api/useApi'
import type { ApiError, PaginatedResponse } from '@/lib/api'
import { membershipRepository, type MembershipListQuery } from '../api/memberships.repository'
import type { Membership } from '../types/membership.types'

interface MembershipsResult {
  memberships: Membership[]
  meta: PaginatedResponse<Membership>['meta'] | null
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

/**
 * Async membership list backed by GET /api/v1/memberships.
 * `memberships` defaults to [] while loading so existing cross-feature
 * consumers (reports, search, reminders) keep working during fetch.
 */
export function useMemberships(query?: MembershipListQuery): MembershipsResult {
  const normalized: MembershipListQuery = {
    page: 1,
    pageSize: 100,
    ...query,
  }
  const { data, meta, isLoading, error, refetch } = useApiList<Membership>(normalized, (q, signal) =>
    membershipRepository.list(q as MembershipListQuery, signal),
  )
  return { memberships: data ?? [], meta, isLoading, error, refetch }
}

interface MembershipResult {
  membership: Membership | null
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

/** Async membership detail backed by GET /api/v1/memberships/{id}. */
export function useMembership(id: string | undefined): MembershipResult {
  const { data, isLoading, error, refetch } = useApiDetail<Membership>(id, (membershipId, signal) =>
    membershipRepository.getById(membershipId, signal),
  )
  return { membership: data, isLoading, error, refetch }
}

interface MemberMembershipsResult {
  memberships: Membership[]
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

/**
 * Async member-scoped membership list backed by
 * GET /api/v1/memberships?memberId=... (paginated, pageSize 100).
 */
export function useMemberMemberships(memberId: string | undefined): MemberMembershipsResult {
  const { data, isLoading, error, refetch } = useApiQuery<Membership[]>(
    (signal) => membershipRepository.listByMemberId(memberId!, signal),
    memberId ?? '',
  )
  return { memberships: data ?? [], isLoading, error, refetch }
}
