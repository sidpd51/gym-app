import { queryMany, queryOne, type Db, type DbPool } from '../../db/pool.js';
import type { AuditRow } from './audit.model.js';
import type { AuditFilter } from './audit.schemas.js';

const WHERE = `WHERE (? IS NULL OR action = ?)
  AND (? IS NULL OR entity_type = ?)
  AND (? IS NULL OR user_id = ?)
  AND (? IS NULL OR status = ?)
  AND (? IS NULL OR timestamp >= ?)
  AND (? IS NULL OR timestamp <= ?)`;

// Each filter appears twice in WHERE (IS NULL guard + comparison), so every value is passed twice.
// from/to are ISO instants; pass Dates so mysql2 formats them as UTC DATETIME.
const params = (f: AuditFilter) => {
  const from = f.from ? new Date(f.from) : null;
  const to = f.to ? new Date(f.to) : null;
  return [f.action, f.action, f.entityType, f.entityType, f.userId, f.userId, f.status, f.status, from, from, to, to];
};

export class AuditRepository {
  constructor(private readonly pool: DbPool) {}

  list(f: AuditFilter, limit: number, offset: number, db: Db = this.pool) {
    return queryMany<AuditRow>(
      db,
      `SELECT * FROM audit_logs ${WHERE} ORDER BY timestamp DESC LIMIT ? OFFSET ?`,
      [...params(f), limit, offset],
    );
  }

  async count(f: AuditFilter, db: Db = this.pool): Promise<number> {
    return (await queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM audit_logs ${WHERE}`, params(f)))!.count;
  }

  findById(id: string, db: Db = this.pool) {
    return queryOne<AuditRow>(db, 'SELECT * FROM audit_logs WHERE id = ?', [id]);
  }
}
