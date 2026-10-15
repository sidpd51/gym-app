import type { Db } from '../db/pool.js';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'VIEW' | 'EXPORT';
export type AuditEntityType =
  | 'USER' | 'MEMBER' | 'MEMBERSHIP_PLAN' | 'MEMBERSHIP' | 'PAYMENT' | 'ATTENDANCE' | 'TRAINER'
  | 'LEAD' | 'EXPENSE' | 'INVENTORY_ITEM' | 'EQUIPMENT' | 'EQUIPMENT_MAINTENANCE'
  | 'NOTIFICATION' | 'SETTINGS';
export type AuditStatus = 'SUCCESS' | 'FAILED';

export interface AuditEntry {
  userId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  entityName?: string;
  description: string;
  status?: AuditStatus;
  metadata?: Record<string, unknown>;
}

/**
 * Inserts an audit record. Pass the transaction client from withTx() so the
 * audit write commits atomically with the primary write; pass the pool for
 * standalone events (failed login, logout).
 */
export async function auditLog(db: Db, e: AuditEntry): Promise<void> {
  await db.query(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, entity_name, description, status, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      e.userId,
      e.action,
      e.entityType,
      e.entityId || null,
      e.entityName || null,
      e.description,
      e.status ?? 'SUCCESS',
      e.metadata && Object.keys(e.metadata).length > 0 ? JSON.stringify(e.metadata) : null,
    ],
  );
}
