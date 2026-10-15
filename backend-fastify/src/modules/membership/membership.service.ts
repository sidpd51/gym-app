import { auditLog } from '../../common/audit.js';
import { badRequest, businessRule, conflict, notFound } from '../../common/errors.js';
import { newPage, pageOffset, type PageQuery } from '../../common/pagination.js';
import { isForeignKeyViolation, isUniqueViolation, withTx, type DbPool } from '../../db/pool.js';
import { toMembershipResponse } from './membership.model.js';
import type { MembershipRepository } from './membership.repository.js';
import type { CreateMembershipInput } from './membership.schemas.js';

/** start + days as YYYY-MM-DD, calendar arithmetic in UTC. */
function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Business rules, transactions and audit for memberships. */
export class MembershipService {
  constructor(
    private readonly pool: DbPool,
    private readonly repo: MembershipRepository,
  ) {}

  async getById(id: string) {
    const row = await this.repo.findById(id);
    if (!row) throw notFound('MEMBERSHIP_NOT_FOUND', 'Membership not found.');
    return toMembershipResponse(row);
  }

  async list(q: PageQuery, f: { status?: string; memberId?: string }) {
    const rows = await this.repo.list(f, q.pageSize, pageOffset(q));
    const total = await this.repo.count(f);
    return newPage(rows.map(toMembershipResponse), q.page, q.pageSize, total);
  }

  async create(actor: string, req: CreateMembershipInput) {
    const plan = await this.repo.findPlanSnapshot(req.planId);
    if (!plan) throw notFound('PLAN_NOT_FOUND', 'Plan not found.');
    if (plan.status !== 'ACTIVE') throw businessRule('PLAN_INACTIVE', 'Cannot assign an INACTIVE plan.');

    // end date is inclusive: start + (duration - 1) days
    const endDate = addDays(req.startDate, plan.duration_in_days - 1);

    const created = await withTx(this.pool, async (tx) => {
      let m;
      try {
        m = await this.repo.insert(
          { memberId: req.memberId, planId: req.planId, planName: plan.name, startDate: req.startDate, endDate, amount: plan.price },
          tx,
        );
      } catch (err) {
        if (isUniqueViolation(err)) throw conflict('MEMBERSHIP_ALREADY_ACTIVE', 'This member already has an active membership.');
        if (isForeignKeyViolation(err)) throw badRequest('INVALID_REFERENCE', 'Member or plan not found.');
        throw err;
      }
      await auditLog(tx, {
        userId: actor, action: 'CREATE', entityType: 'MEMBERSHIP', entityId: m.id,
        entityName: plan.name, description: `Created membership (plan=${plan.name})`,
      });
      return m;
    });
    return toMembershipResponse(created);
  }
}
