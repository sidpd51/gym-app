import { auditLog } from '../../common/audit.js';
import { badRequest, conflict, notFound } from '../../common/errors.js';
import { newPage, pageOffset, type PageQuery } from '../../common/pagination.js';
import { exec, isForeignKeyViolation, queryMany, queryOne, withTx, type DbPool } from '../../db/pool.js';
import { decimalOut, isPositive } from './decimal.js';

export interface PlanRow {
  id: string;
  name: string;
  description: string | null;
  duration_in_days: number;
  price: string;
  status: string;
  created_at: Date;
}

export function toPlanResponse(p: PlanRow) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    durationInDays: p.duration_in_days,
    price: decimalOut(p.price),
    status: p.status,
    createdAt: p.created_at,
  };
}

export interface CreatePlanInput {
  name: string;
  description?: string | null;
  durationInDays: number;
  price: string;
  status?: string | null;
}
export interface UpdatePlanInput {
  name?: string | null;
  description?: string | null;
  durationInDays?: number | null;
  price?: string | null;
  status?: string | null;
}

const FILTER = `WHERE ($1::plan_status IS NULL OR status = $1::plan_status)`;

export class PlanService {
  constructor(private readonly pool: DbPool) {}

  async getByID(id: string) {
    const row = await queryOne<PlanRow>(this.pool, 'SELECT * FROM membership_plans WHERE id = $1', [id]);
    if (!row) throw notFound('PLAN_NOT_FOUND', 'Membership plan not found.');
    return toPlanResponse(row);
  }

  async list(q: PageQuery, f: { status?: string }) {
    const status = f.status || null;
    const rows = await queryMany<PlanRow>(
      this.pool,
      `SELECT * FROM membership_plans ${FILTER} ORDER BY name ASC LIMIT $2 OFFSET $3`,
      [status, q.pageSize, pageOffset(q)],
    );
    const total = (await queryOne<{ count: number }>(this.pool, `SELECT COUNT(*) FROM membership_plans ${FILTER}`, [status]))!.count;
    return newPage(rows.map(toPlanResponse), q.page, q.pageSize, total);
  }

  async create(actor: string, req: CreatePlanInput) {
    if (!isPositive(req.price)) throw badRequest('INVALID_PRICE', 'Price must be greater than zero.');
    const created = await withTx(this.pool, async (tx) => {
      const p = (await queryOne<PlanRow>(
        tx,
        `INSERT INTO membership_plans (name, description, duration_in_days, price, status)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [req.name, req.description ?? null, req.durationInDays, req.price, req.status ?? 'ACTIVE'],
      ))!;
      await auditLog(tx, {
        userId: actor, action: 'CREATE', entityType: 'MEMBERSHIP_PLAN', entityId: p.id,
        entityName: p.name, description: `Created plan "${p.name}"`,
      });
      return p;
    });
    return toPlanResponse(created);
  }

  async update(actor: string, id: string, req: UpdatePlanInput) {
    if (req.price != null && !isPositive(req.price)) throw badRequest('INVALID_PRICE', 'Price must be greater than zero.');
    const updated = await withTx(this.pool, async (tx) => {
      const p = await queryOne<PlanRow>(
        tx,
        `UPDATE membership_plans
         SET name = COALESCE($2, name), description = COALESCE($3, description),
             duration_in_days = COALESCE($4, duration_in_days), price = COALESCE($5, price),
             status = COALESCE($6::plan_status, status)
         WHERE id = $1 RETURNING *`,
        [id, req.name ?? null, req.description ?? null, req.durationInDays ?? null, req.price ?? null, req.status ?? null],
      );
      if (!p) throw notFound('PLAN_NOT_FOUND', 'Membership plan not found.');
      await auditLog(tx, {
        userId: actor, action: 'UPDATE', entityType: 'MEMBERSHIP_PLAN', entityId: p.id,
        entityName: p.name, description: 'Updated plan',
      });
      return p;
    });
    return toPlanResponse(updated);
  }

  async delete(actor: string, id: string) {
    await withTx(this.pool, async (tx) => {
      const existing = await queryOne<PlanRow>(tx, 'SELECT * FROM membership_plans WHERE id = $1', [id]);
      if (!existing) throw notFound('PLAN_NOT_FOUND', 'Plan not found.');
      try {
        await exec(tx, 'DELETE FROM membership_plans WHERE id = $1', [id]);
      } catch (err) {
        if (isForeignKeyViolation(err)) {
          throw conflict('PLAN_REFERENCED', 'This plan cannot be deleted because memberships reference it.');
        }
        throw err;
      }
      await auditLog(tx, {
        userId: actor, action: 'DELETE', entityType: 'MEMBERSHIP_PLAN', entityId: id,
        entityName: existing.name, description: `Deleted plan "${existing.name}"`,
      });
    });
  }
}
