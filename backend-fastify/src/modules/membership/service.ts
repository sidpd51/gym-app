import { auditLog } from '../../common/audit.js';
import { badRequest, businessRule, conflict, notFound } from '../../common/errors.js';
import { newPage, pageOffset, type PageQuery } from '../../common/pagination.js';
import { isForeignKeyViolation, isUniqueViolation, queryMany, queryOne, withTx, type DbPool } from '../../db/pool.js';
import { decimalOut } from '../plan/decimal.js';

interface MembershipRow {
  id: string;
  member_id: string;
  plan_id: string;
  plan_name: string;
  start_date: string;
  end_date: string;
  amount: string;
  status: string;
  created_at: Date;
}

export function toMembershipResponse(m: MembershipRow) {
  return {
    id: m.id,
    memberId: m.member_id,
    planId: m.plan_id,
    planName: m.plan_name,
    startDate: m.start_date,
    endDate: m.end_date,
    amount: decimalOut(m.amount),
    status: m.status,
    createdAt: m.created_at,
  };
}

const FILTER = `WHERE ($1::membership_status IS NULL OR status = $1::membership_status)
  AND ($2::uuid IS NULL OR member_id = $2::uuid)`;

/** start + (days-1) as YYYY-MM-DD, calendar arithmetic in UTC. */
function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export class MembershipService {
  constructor(private readonly pool: DbPool) {}

  async getByID(id: string) {
    const row = await queryOne<MembershipRow>(this.pool, 'SELECT * FROM memberships WHERE id = $1', [id]);
    if (!row) throw notFound('MEMBERSHIP_NOT_FOUND', 'Membership not found.');
    return toMembershipResponse(row);
  }

  async list(q: PageQuery, f: { status?: string; memberId?: string }) {
    const params = [f.status || null, f.memberId || null];
    const rows = await queryMany<MembershipRow>(
      this.pool,
      `SELECT * FROM memberships ${FILTER} ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
      [...params, q.pageSize, pageOffset(q)],
    );
    const total = (await queryOne<{ count: number }>(this.pool, `SELECT COUNT(*) FROM memberships ${FILTER}`, params))!.count;
    return newPage(rows.map(toMembershipResponse), q.page, q.pageSize, total);
  }

  async create(actor: string, req: { memberId: string; planId: string; startDate: string }) {
    const plan = await queryOne<{ name: string; price: string; status: string; duration_in_days: number }>(
      this.pool, 'SELECT * FROM membership_plans WHERE id = $1', [req.planId],
    );
    if (!plan) throw notFound('PLAN_NOT_FOUND', 'Plan not found.');
    if (plan.status !== 'ACTIVE') throw businessRule('PLAN_INACTIVE', 'Cannot assign an INACTIVE plan.');

    const endDate = addDays(req.startDate, plan.duration_in_days - 1);

    const created = await withTx(this.pool, async (tx) => {
      let m: MembershipRow;
      try {
        m = (await queryOne<MembershipRow>(
          tx,
          `INSERT INTO memberships (member_id, plan_id, plan_name, start_date, end_date, amount, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE') RETURNING *`,
          [req.memberId, req.planId, plan.name, req.startDate, endDate, plan.price],
        ))!;
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
