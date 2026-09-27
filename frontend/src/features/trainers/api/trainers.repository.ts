import type { Trainer } from '../types/trainer.types'
import { trainersMockData } from '../data/trainers.mock'

export interface TrainerRepository {
  list(): Trainer[]
  getById(id: string): Trainer | undefined
}

export const mockTrainerRepository: TrainerRepository = {
  list: () => trainersMockData,
  getById: (id) => trainersMockData.find((item) => item.id === id),
}

export const trainerRepository: TrainerRepository = mockTrainerRepository
