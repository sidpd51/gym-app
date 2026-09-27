import type { GymSettings } from '../types/settings.types'
import { defaultSettings } from '../data/settings.mock'

export interface SettingsRepository {
  get(): GymSettings
  save(settings: GymSettings): void
}

export const mockSettingsRepository: SettingsRepository = {
  get: () => defaultSettings,
  save: (settings) => {
    console.log('[mockSettingsRepository] save:', settings)
  },
}

export const settingsRepository: SettingsRepository = mockSettingsRepository
