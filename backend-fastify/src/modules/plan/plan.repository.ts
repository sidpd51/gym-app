import { exec, newId, queryMany, queryOne, type Db, type DbPool } from '../../db/pool.js';
import type { PlanRow } from './plan.model.js';
import type { CreatePlanInput, UpdatePlanInput } from './plan.schemas.js';

const FILTER = `WHERE (? IS NULL OR status = ?)`;

/** Data access for `membership_plans`: all SQL, no business rules. */
export class PlanRepository {
  constructor(private readonly pool: DbPool) {}

  findById(id: string, db: Db = this.pool) {
    return queryOne<PlanRow>(db, 'SELECT * FROM membership_plans WHERE id = ?', [id]);
  }

  list(status: string | undefined, limit: number, offset: number, db: Db = this.pool) {
    return queryMany<PlanRow>(
      db,
      `SELECT * FROM membership_plans ${FILTER} ORDER BY name ASC LIMIT ? OFFSET ?`,
      [status || null, status || null, limit, offset],
    );
  }

  async count(status: string | undefined, db: Db = this.pool): Promise<number> {
    const row = await queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM membership_plans ${FILTER}`, [status || null, status || null]);
    return row!.count;
  }

  async insert(req: CreatePlanInput, db: Db = this.pool): Promise<PlanRow> {
    const id = newId();
    await exec(
      db,
      `INSERT INTO membership_plans (id, name, description, duration_in_days, price, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, req.name, req.description ?? null, req.durationInDays, req.price, req.status ?? 'ACTIVE'],
    );
    return (await this.findById(id, db))!;
  }

  async update(id: string, req: UpdatePlanInput, db: Db = this.pool) {
    const matched = await exec(
      db,
      `UPDATE membership_plans
       SET name = COALESCE(?, name), description = COALESCE(?, description),
           duration_in_days = COALESCE(?, duration_in_days), price = COALESCE(?, price),
           status = COALESCE(?, status)
       WHERE id = ?`,
      [req.name ?? null, req.description ?? null, req.durationInDays ?? null, req.price ?? null, req.status ?? null, id],
    );
    return matched ? this.findById(id, db) : undefined;
  }

  delete(id: string, db: Db = this.pool) {
    return exec(db, 'DELETE FROM membership_plans WHERE id = ?', [id]);
  }
}
