import { apiClient } from '@/lib/api'
import type { ListQueryParams, PaginatedResponse } from '@/lib/api'
import type { Trainer, TrainerStatus } from '../types/trainer.types'
import { trainersMockData } from '../data/trainers.mock'

// Backend trainer Response (internal/modules/trainer/trainer.go).
export interface BackendTrainer {
  id: string
  trainerCode: string
  firstName: string
  lastName: string
  phone: string
  email: string | null
  specialization: string | null
  joiningDate: string
  status: TrainerStatus
  createdAt: string
}

export function mapBackendTrainer(payload: BackendTrainer): Trainer {
  return {
    id: payload.id,
    trainerCode: payload.trainerCode,
    firstName: payload.firstName,
    lastName: payload.lastName,
    phone: payload.phone,
    email: payload.email ?? undefined,
    specialization: payload.specialization ?? undefined,
    joiningDate: payload.joiningDate,
    status: payload.status,
  }
}

export interface TrainerListQuery extends ListQueryParams {
  status?: TrainerStatus
}

export interface CreateTrainerInput {
  firstName: string
  lastName: string
  phone: string
  email?: string
  specialization?: string
  joiningDate: string
}

export interface UpdateTrainerInput {
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
  specialization?: string
  status?: TrainerStatus
}

export interface TrainerRepository {
  list(query?: TrainerListQuery): Promise<PaginatedResponse<Trainer>>
  getById(id: string): Promise<Trainer>
  create(input: CreateTrainerInput): Promise<Trainer>
  update(id: string, input: UpdateTrainerInput): Promise<Trainer>
  remove(id: string): Promise<void>
}

function toQuery(query?: TrainerListQuery): ListQueryParams {
  return {
    page: query?.page ?? 1,
    pageSize: query?.pageSize ?? 100,
    status: query?.status,
  }
}

export const apiTrainerRepository: TrainerRepository = {
  async list(query?: TrainerListQuery): Promise<PaginatedResponse<Trainer>> {
    const res = await apiClient.get<PaginatedResponse<BackendTrainer>>(
      '/api/v1/trainers',
      toQuery(query),
    )
    return {
      meta: res.meta,
      data: res.data.map(mapBackendTrainer),
    }
  },

  async getById(id: string): Promise<Trainer> {
    const res = await apiClient.get<BackendTrainer>(`/api/v1/trainers/${id}`)
    return mapBackendTrainer(res)
  },

  async create(input: CreateTrainerInput): Promise<Trainer> {
    const res = await apiClient.post<BackendTrainer>('/api/v1/trainers', {
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      email: input.email || undefined,
      specialization: input.specialization || undefined,
      joiningDate: input.joiningDate,
    })
    return mapBackendTrainer(res)
  },

  async update(id: string, input: UpdateTrainerInput): Promise<Trainer> {
    const res = await apiClient.patch<BackendTrainer>(`/api/v1/trainers/${id}`, input)
    return mapBackendTrainer(res)
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete<void>(`/api/v1/trainers/${id}`)
  },
}

// Kept for unit tests / offline reference. No longer the default.
export const mockTrainerRepository = {
  list: (): Trainer[] => trainersMockData,
  getById: (id: string): Trainer | undefined => trainersMockData.find((t) => t.id === id),
}

export const trainerRepository: TrainerRepository = apiTrainerRepository
