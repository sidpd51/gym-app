import { settingsRepository } from '../api/settings.repository'
import type { GymSettings } from '../types/settings.types'

export function useSettings(): { settings: GymSettings } {
  return { settings: settingsRepository.get() }
}
