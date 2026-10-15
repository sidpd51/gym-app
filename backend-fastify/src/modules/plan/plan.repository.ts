import { exec, queryMany, queryOne, type Db, type DbPool } from '../../db/pool.js';
import type { PlanRow } from './plan.model.js';
import type { CreatePlanInput, UpdatePlanInput } from './plan.schemas.js';

const FILTER = `WHERE ($1::plan_status IS NULL OR status = $1::plan_status)`;

/** Data access for `membership_plans`: all SQL, no business rules. */
export class PlanRepository {
  constructor(private readonly pool: DbPool) {}

  findById(id: string, db: Db = this.pool) {
    return queryOne<PlanRow>(db, 'SELECT * FROM membership_plans WHERE id = $1', [id]);
  }

  list(status: string | undefined, limit: number, offset: number, db: Db = this.pool) {
    return queryMany<PlanRow>(
      db,
      `SELECT * FROM membership_plans ${FILTER} ORDER BY name ASC LIMIT $2 OFFSET $3`,
      [status || null, limit, offset],
    );
  }

  async count(status: string | undefined, db: Db = this.pool): Promise<number> {
    const row = await queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM membership_plans ${FILTER}`, [status || null]);
    return row!.count;
  }

  async insert(req: CreatePlanInput, db: Db = this.pool): Promise<PlanRow> {
    const row = await queryOne<PlanRow>(
      db,
      `INSERT INTO membership_plans (name, description, duration_in_days, price, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.name, req.description ?? null, req.durationInDays, req.price, req.status ?? 'ACTIVE'],
    );
    return row!;
  }

  update(id: string, req: UpdatePlanInput, db: Db = this.pool) {
    return queryOne<PlanRow>(
      db,
      `UPDATE membership_plans
       SET name = COALESCE($2, name), description = COALESCE($3, description),
           duration_in_days = COALESCE($4, duration_in_days), price = COALESCE($5, price),
           status = COALESCE($6::plan_status, status)
       WHERE id = $1 RETURNING *`,
      [id, req.name ?? null, req.description ?? null, req.durationInDays ?? null, req.price ?? null, req.status ?? null],
    );
  }

  delete(id: string, db: Db = this.pool) {
    return exec(db, 'DELETE FROM membership_plans WHERE id = $1', [id]);
  }
}
