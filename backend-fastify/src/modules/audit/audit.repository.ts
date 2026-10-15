import { queryMany, queryOne, type Db, type DbPool } from '../../db/pool.js';
import type { AuditRow } from './audit.model.js';
import type { AuditFilter } from './audit.schemas.js';

const WHERE = `WHERE ($1::audit_action IS NULL OR action = $1::audit_action)
  AND ($2::audit_entity_type IS NULL OR entity_type = $2::audit_entity_type)
  AND ($3::uuid IS NULL OR user_id = $3::uuid)
  AND ($4::audit_status IS NULL OR status = $4::audit_status)
  AND ($5::timestamptz IS NULL OR timestamp >= $5::timestamptz)
  AND ($6::timestamptz IS NULL OR timestamp <= $6::timestamptz)`;

const params = (f: AuditFilter) => [f.action, f.entityType, f.userId, f.status, f.from, f.to];

export class AuditRepository {
  constructor(private readonly pool: DbPool) {}

  list(f: AuditFilter, limit: number, offset: number, db: Db = this.pool) {
    return queryMany<AuditRow>(
      db,
      `SELECT * FROM audit_logs ${WHERE} ORDER BY timestamp DESC LIMIT $7 OFFSET $8`,
      [...params(f), limit, offset],
    );
  }

  async count(f: AuditFilter, db: Db = this.pool): Promise<number> {
    return (await queryOne<{ count: number }>(db, `SELECT COUNT(*) FROM audit_logs ${WHERE}`, params(f)))!.count;
  }

  findById(id: string, db: Db = this.pool) {
    return queryOne<AuditRow>(db, 'SELECT * FROM audit_logs WHERE id = $1', [id]);
  }
}
