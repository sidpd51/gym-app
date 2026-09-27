import { auditLogRepository } from '../api/audit-logs.repository'
import type { AuditLog } from '../types/audit-log.types'

export function useAuditLogs(): { logs: AuditLog[] } {
  return { logs: auditLogRepository.list() }
}

export function useAuditLog(id: string | undefined): { log: AuditLog | undefined } {
  return { log: id ? auditLogRepository.getById(id) : undefined }
}
