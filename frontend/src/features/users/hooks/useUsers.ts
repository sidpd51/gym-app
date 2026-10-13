import { useApiDetail, useApiList } from '@/lib/api/useApi'
import type { ApiError } from '@/lib/api'
import type { PaginatedResponse } from '@/lib/api'
import { userRepository, type UserListQuery } from '../api/users.repository'
import type { User } from '../types/user.types'

interface UsersResult {
  users: User[]
  meta: PaginatedResponse<User>['meta'] | null
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

/**
 * Async user list backed by GET /api/v1/users.
 * `users` defaults to [] while loading so existing consumers
 * (e.g. audit-log name resolution) keep working during fetch.
 */
export function useUsers(query?: UserListQuery): UsersResult {
  const normalized: UserListQuery = {
    page: 1,
    pageSize: 100,
    ...query,
  }
  const { data, meta, isLoading, error, refetch } = useApiList<User>(normalized, (q) =>
    userRepository.list(q as UserListQuery),
  )
  return { users: data ?? [], meta, isLoading, error, refetch }
}

interface UserResult {
  user: User | null
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

/** Async user detail backed by GET /api/v1/users/{id}. */
export function useUser(id: string | undefined): UserResult {
  const { data, isLoading, error, refetch } = useApiDetail<User>(id, (userId) =>
    userRepository.getById(userId),
  )
  return { user: data, isLoading, error, refetch }
}
