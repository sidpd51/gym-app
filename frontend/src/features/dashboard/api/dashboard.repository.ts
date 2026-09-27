import type { DashboardData } from '../types/dashboard.types'
import { dashboardMockData } from '../data/dashboard.mock'

export interface DashboardRepository {
  getData(): DashboardData
}

export const mockDashboardRepository: DashboardRepository = {
  getData: () => dashboardMockData,
}

export const dashboardRepository: DashboardRepository = mockDashboardRepository
