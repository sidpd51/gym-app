import { exec, newId, queryMany, queryOne, type Db, type DbPool } from '../../db/pool.js';
import type { PaymentRow } from './payment.model.js';
import type { CreatePaymentInput } from './payment.schemas.js';

const FILTER = `WHERE (? IS NULL OR status = ?)
  AND (? IS NULL OR member_id = ?)
  AND (? IS NULL OR payment_date >= ?)
  AND (? IS NULL OR payment_date <= ?)`;
const filterParams = (f: PaymentFilter) => [f.status, f.status, f.memberId, f.memberId, f.from, f.from, f.to, f.to];

export interface PaymentFilter {
  status: string | null;
  memberId: string | null;
  from: string | null;
  to: string | null;
}

/** Data access for `payments`: all SQL, no business rules. */
export class PaymentRepository {
  constructor(private readonly pool: DbPool) {}

  findById(id: string, db: Db = this.pool) {
    return queryOne<PaymentRow>(db, 'SELECT * FROM payments WHERE id = ?', [id]);
  }

  list(f: PaymentFilter, limit: number, offset: number, db: Db = this.pool) {
    return queryMany<PaymentRow>(
      db,
      `SELECT * FROM payments ${FILTER} ORDER BY payment_date DESC, created_at DESC LIMIT ? OFFSET ?`,
      [...filterParams(f), limit, offset],
    );
  }

  async count(f: PaymentFilter, db: Db = this.pool): Promise<number> {
    const row = await queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM payments ${FILTER}`, filterParams(f));
    return row!.count;
  }

  async insert(req: CreatePaymentInput, db: Db = this.pool): Promise<PaymentRow> {
    const id = newId();
    await exec(
      db,
      `INSERT INTO payments (id, member_id, membership_id, amount, payment_method, payment_date, status, reference, notes)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        id, req.memberId, req.membershipId ?? null, req.amount, req.paymentMethod, req.paymentDate,
        req.status ?? 'COMPLETED', req.reference ?? null, req.notes ?? null,
      ],
    );
    return (await this.findById(id, db))!;
  }
}
