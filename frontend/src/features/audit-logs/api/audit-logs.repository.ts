import type { AuditLog } from '../types/audit-log.types'
import { auditLogsMockData } from '../data/audit-logs.mock'

export interface AuditLogRepository {
  list(): AuditLog[]
  getById(id: string): AuditLog | undefined
}

export const mockAuditLogRepository: AuditLogRepository = {
  list: () => auditLogsMockData,
  getById: (id) => auditLogsMockData.find((item) => item.id === id),
}

export const auditLogRepository: AuditLogRepository = mockAuditLogRepository
