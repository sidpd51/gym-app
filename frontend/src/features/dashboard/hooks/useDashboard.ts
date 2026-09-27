import { dashboardRepository } from '../api/dashboard.repository'
import type { DashboardData } from '../types/dashboard.types'

export function useDashboard(): { data: DashboardData } {
  return { data: dashboardRepository.getData() }
}
