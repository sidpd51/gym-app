import { apiClient } from '@/lib/api'
import type { ListQueryParams, PaginatedResponse } from '@/lib/api'
import type { User, UserRole, UserStatus } from '../types/user.types'
import { usersMockData } from '../data/users.mock'

// Backend UserResponse (internal/modules/user/dto.go). Field names match the
// frontend User type; only nullability differs (phone/lastLoginAt).
export interface BackendUser {
  id: string
  userCode: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  role: UserRole
  status: UserStatus
  lastLoginAt: string | null
  createdAt: string
}

export function mapBackendUser(payload: BackendUser): User {
  return {
    id: payload.id,
    userCode: payload.userCode,
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    phone: payload.phone ?? undefined,
    role: payload.role,
    status: payload.status,
    lastLoginAt: payload.lastLoginAt ?? undefined,
    createdAt: payload.createdAt,
  }
}

export interface UserListQuery extends ListQueryParams {
  role?: UserRole
  status?: UserStatus
}

export interface CreateUserInput {
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: UserRole
  password: string
}

export interface UpdateUserInput {
  firstName?: string
  lastName?: string
  phone?: string
  role?: UserRole
  status?: UserStatus
}

export interface UserRepository {
  list(query?: UserListQuery, signal?: AbortSignal): Promise<PaginatedResponse<User>>
  getById(id: string, signal?: AbortSignal): Promise<User>
  create(input: CreateUserInput): Promise<User>
  update(id: string, input: UpdateUserInput): Promise<User>
  remove(id: string): Promise<void>
}

function toQuery(query?: UserListQuery): ListQueryParams {
  return {
    page: query?.page ?? 1,
    pageSize: query?.pageSize ?? 100,
    role: query?.role,
    status: query?.status,
    search: query?.search,
  }
}

export const apiUserRepository: UserRepository = {
  async list(query?: UserListQuery, signal?: AbortSignal): Promise<PaginatedResponse<User>> {
    const res = await apiClient.get<PaginatedResponse<BackendUser>>('/api/v1/users', toQuery(query), { signal })
    return {
      meta: res.meta,
      data: res.data.map(mapBackendUser),
    }
  },

  async getById(id: string, signal?: AbortSignal): Promise<User> {
    const res = await apiClient.get<BackendUser>(`/api/v1/users/${id}`, undefined, { signal })
    return mapBackendUser(res)
  },

  async create(input: CreateUserInput): Promise<User> {
    const res = await apiClient.post<BackendUser>('/api/v1/users', {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone || undefined,
      role: input.role,
      password: input.password,
    })
    return mapBackendUser(res)
  },

  async update(id: string, input: UpdateUserInput): Promise<User> {
    const res = await apiClient.patch<BackendUser>(`/api/v1/users/${id}`, input)
    return mapBackendUser(res)
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete<void>(`/api/v1/users/${id}`)
  },
}

// Kept for unit tests / offline reference. No longer the default.
export const mockUserRepository = {
  list: (): User[] => usersMockData,
  getById: (id: string): User | undefined => usersMockData.find((item) => item.id === id),
}

export const userRepository: UserRepository = apiUserRepository
