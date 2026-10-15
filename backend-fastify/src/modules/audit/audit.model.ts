export interface AuditRow {
  id: string;
  timestamp: Date;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  description: string;
  status: string;
  metadata: unknown | null;
}

export interface AuditResponse {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  entityName: string | null;
  description: string;
  status: string;
  metadata?: unknown;
}

export function toAuditResponse(a: AuditRow): AuditResponse {
  return {
    id: a.id,
    timestamp: a.timestamp,
    userId: a.user_id,
    action: a.action,
    entityType: a.entity_type,
    entityId: a.entity_id,
    entityName: a.entity_name,
    description: a.description,
    status: a.status,
    // omitempty: dropped when the row has no metadata
    ...(a.metadata != null ? { metadata: a.metadata } : {}),
  };
}
