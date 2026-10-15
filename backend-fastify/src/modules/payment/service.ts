import { auditLog } from '../../common/audit.js';
import { badRequest, notFound } from '../../common/errors.js';
import { newPage, pageOffset, type PageQuery } from '../../common/pagination.js';
import { dateString } from '../../common/validate.js';
import { isForeignKeyViolation, queryMany, queryOne, withTx, type DbPool } from '../../db/pool.js';
import { decimalOut, isPositive } from '../plan/decimal.js';

interface PaymentRow {
  id: string;
  member_id: string;
  membership_id: string | null;
  amount: string;
  payment_method: string;
  payment_date: string;
  status: string;
  reference: string | null;
  notes: string | null;
  created_at: Date;
}

export function toPaymentResponse(p: PaymentRow) {
  return {
    id: p.id,
    memberId: p.member_id,
    membershipId: p.membership_id,
    amount: decimalOut(p.amount),
    paymentMethod: p.payment_method,
    paymentDate: p.payment_date,
    status: p.status,
    reference: p.reference,
    notes: p.notes,
    createdAt: p.created_at,
  };
}

const FILTER = `WHERE ($1::payment_status IS NULL OR status = $1::payment_status)
  AND ($2::uuid IS NULL OR member_id = $2::uuid)
  AND ($3::date IS NULL OR payment_date >= $3::date)
  AND ($4::date IS NULL OR payment_date <= $4::date)`;

export interface CreatePaymentInput {
  memberId: string;
  membershipId?: string | null;
  amount: string;
  paymentMethod: string;
  paymentDate: string;
  status?: string | null;
  reference?: string | null;
  notes?: string | null;
}

function checkDate(v: string | undefined, field: string): string | null {
  if (!v) return null;
  if (!dateString.safeParse(v).success) throw badRequest('INVALID_DATE', `${field} must be YYYY-MM-DD`);
  return v;
}

export class PaymentService {
  constructor(private readonly pool: DbPool) {}

  async getByID(id: string) {
    const row = await queryOne<PaymentRow>(this.pool, 'SELECT * FROM payments WHERE id = $1', [id]);
    if (!row) throw notFound('PAYMENT_NOT_FOUND', 'Payment not found.');
    return toPaymentResponse(row);
  }

  async list(q: PageQuery, f: { status?: string; memberId?: string; from?: string; to?: string }) {
    const params = [f.status || null, f.memberId || null, checkDate(f.from, 'fromDate'), checkDate(f.to, 'toDate')];
    const rows = await queryMany<PaymentRow>(
      this.pool,
      `SELECT * FROM payments ${FILTER} ORDER BY payment_date DESC, created_at DESC LIMIT $5 OFFSET $6`,
      [...params, q.pageSize, pageOffset(q)],
    );
    const total = (await queryOne<{ count: number }>(this.pool, `SELECT COUNT(*) FROM payments ${FILTER}`, params))!.count;
    return newPage(rows.map(toPaymentResponse), q.page, q.pageSize, total);
  }

  async create(actor: string, req: CreatePaymentInput) {
    if (!isPositive(req.amount)) throw badRequest('INVALID_AMOUNT', 'Amount must be greater than zero.');
    const created = await withTx(this.pool, async (tx) => {
      let p: PaymentRow;
      try {
        p = (await queryOne<PaymentRow>(
          tx,
          `INSERT INTO payments (member_id, membership_id, amount, payment_method, payment_date, status, reference, notes)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
          [
            req.memberId, req.membershipId ?? null, req.amount, req.paymentMethod, req.paymentDate,
            req.status ?? 'COMPLETED', req.reference ?? null, req.notes ?? null,
          ],
        ))!;
      } catch (err) {
        if (isForeignKeyViolation(err)) throw badRequest('INVALID_REFERENCE', 'Member or membership not found.');
        throw err;
      }
      await auditLog(tx, {
        userId: actor, action: 'CREATE', entityType: 'PAYMENT', entityId: p.id,
        description: `Payment ${decimalOut(req.amount)} ${req.paymentMethod}`,
      });
      return p;
    });
    return toPaymentResponse(created);
  }
}
