import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { badRequest, notFound } from '../../common/errors.js';
import { newPage, pageOffset, parsePageQuery } from '../../common/pagination.js';
import { dateString, uuidParam } from '../../common/validate.js';
import { queryMany, queryOne, type DbPool } from '../../db/pool.js';
import type { ModuleContext } from '../context.js';

function toResponse(a: any) {
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

const WHERE = `WHERE ($1::audit_action IS NULL OR action = $1::audit_action)
  AND ($2::audit_entity_type IS NULL OR entity_type = $2::audit_entity_type)
  AND ($3::uuid IS NULL OR user_id = $3::uuid)
  AND ($4::audit_status IS NULL OR status = $4::audit_status)
  AND ($5::timestamptz IS NULL OR timestamp >= $5::timestamptz)
  AND ($6::timestamptz IS NULL OR timestamp <= $6::timestamptz)`;

class AuditService {
  constructor(private readonly pool: DbPool) {}

  async list(query: Record<string, string>) {
    const q = parsePageQuery(query);
    if (query.userId && !z.uuid().safeParse(query.userId).success) throw badRequest('INVALID_UUID', 'Invalid userId.');
    let from: string | null = null;
    let to: string | null = null;
    if (q.fromDate) {
      if (!dateString.safeParse(q.fromDate).success) throw badRequest('INVALID_DATE', 'from must be YYYY-MM-DD');
      from = `${q.fromDate}T00:00:00Z`;
    }
    if (q.toDate) {
      if (!dateString.safeParse(q.toDate).success) throw badRequest('INVALID_DATE', 'to must be YYYY-MM-DD');
      to = new Date(Date.parse(`${q.toDate}T00:00:00Z`) + 24 * 3600_000 - 1000).toISOString();
    }
    const params = [query.action || null, query.entityType || null, query.userId || null, q.status || null, from, to];
    const rows = await queryMany(
      this.pool, `SELECT * FROM audit_logs ${WHERE} ORDER BY timestamp DESC LIMIT $7 OFFSET $8`,
      [...params, q.pageSize, pageOffset(q)]);
    const total = (await queryOne<{ count: number }>(this.pool, `SELECT COUNT(*) FROM audit_logs ${WHERE}`, params))!.count;
    return newPage(rows.map(toResponse), q.page, q.pageSize, total);
  }

  async get(id: string) {
    const row = await queryOne(this.pool, 'SELECT * FROM audit_logs WHERE id = $1', [id]);
    if (!row) throw notFound('AUDIT_NOT_FOUND', 'Audit log not found.');
    return toResponse(row);
  }
}

export function auditModule(ctx: ModuleContext): FastifyPluginAsync {
  const svc = new AuditService(ctx.pool);
  return async (app) => {
    app.get('/audit-logs', { onRequest: [app.requirePermission('audit-logs:view')] }, async (req) =>
      svc.list(req.query as Record<string, string>),
    );
    app.get('/audit-logs/:id', { onRequest: [app.requirePermission('audit-logs:view')] }, async (req) =>
      svc.get(uuidParam(req, 'id', 'Invalid id.')),
    );
  };
}
