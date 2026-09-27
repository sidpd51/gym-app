import { trainerRepository } from '../api/trainers.repository'
import type { Trainer } from '../types/trainer.types'

export function useTrainers(): { trainers: Trainer[] } {
  return { trainers: trainerRepository.list() }
}

export function useTrainer(id: string | undefined): { trainer: Trainer | undefined } {
  return { trainer: id ? trainerRepository.getById(id) : undefined }
}
