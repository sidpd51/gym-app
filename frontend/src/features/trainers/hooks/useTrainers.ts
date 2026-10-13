import { useApiDetail, useApiList } from '@/lib/api/useApi'
import type { ApiError, PaginatedResponse } from '@/lib/api'
import { trainerRepository, type TrainerListQuery } from '../api/trainers.repository'
import type { Trainer } from '../types/trainer.types'

interface TrainersResult {
  trainers: Trainer[]
  meta: PaginatedResponse<Trainer>['meta'] | null
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

/**
 * Async trainer list backed by GET /api/v1/trainers.
 * `trainers` defaults to [] while loading so existing cross-feature
 * consumers (member forms, assignment pages) keep working during fetch.
 */
export function useTrainers(query?: TrainerListQuery): TrainersResult {
  const normalized: TrainerListQuery = {
    page: 1,
    pageSize: 100,
    ...query,
  }
  const { data, meta, isLoading, error, refetch } = useApiList<Trainer>(normalized, (q) =>
    trainerRepository.list(q as TrainerListQuery),
  )
  return { trainers: data ?? [], meta, isLoading, error, refetch }
}

interface TrainerResult {
  trainer: Trainer | null
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

/** Async trainer detail backed by GET /api/v1/trainers/{id}. */
export function useTrainer(id: string | undefined): TrainerResult {
  const { data, isLoading, error, refetch } = useApiDetail<Trainer>(id, (trainerId) =>
    trainerRepository.getById(trainerId),
  )
  return { trainer: data, isLoading, error, refetch }
}
