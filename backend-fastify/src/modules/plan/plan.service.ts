import { auditLog } from '../../common/audit.js';
import { badRequest, conflict, notFound } from '../../common/errors.js';
import { newPage, pageOffset, type PageQuery } from '../../common/pagination.js';
import { isForeignKeyViolation, withTx, type DbPool } from '../../db/pool.js';
import { isPositive, toPlanResponse } from './plan.model.js';
import type { PlanRepository } from './plan.repository.js';
import type { CreatePlanInput, UpdatePlanInput } from './plan.schemas.js';

/** Business rules, transactions and audit for membership plans. */
export class PlanService {
  constructor(
    private readonly pool: DbPool,
    private readonly repo: PlanRepository,
  ) {}

  async getById(id: string) {
    const row = await this.repo.findById(id);
    if (!row) throw notFound('PLAN_NOT_FOUND', 'Membership plan not found.');
    return toPlanResponse(row);
  }

  async list(q: PageQuery, f: { status?: string }) {
    const rows = await this.repo.list(f.status, q.pageSize, pageOffset(q));
    const total = await this.repo.count(f.status);
    return newPage(rows.map(toPlanResponse), q.page, q.pageSize, total);
  }

  async create(actor: string, req: CreatePlanInput) {
    if (!isPositive(req.price)) throw badRequest('INVALID_PRICE', 'Price must be greater than zero.');
    const created = await withTx(this.pool, async (tx) => {
      const p = await this.repo.insert(req, tx);
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
      const p = await this.repo.update(id, req, tx);
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
      const existing = await this.repo.findById(id, tx);
      if (!existing) throw notFound('PLAN_NOT_FOUND', 'Plan not found.');
      try {
        await this.repo.delete(id, tx);
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
