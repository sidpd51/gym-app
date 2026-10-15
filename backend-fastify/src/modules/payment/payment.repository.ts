import { queryMany, queryOne, type Db, type DbPool } from '../../db/pool.js';
import type { PaymentRow } from './payment.model.js';
import type { CreatePaymentInput } from './payment.schemas.js';

const FILTER = `WHERE ($1::payment_status IS NULL OR status = $1::payment_status)
  AND ($2::uuid IS NULL OR member_id = $2::uuid)
  AND ($3::date IS NULL OR payment_date >= $3::date)
  AND ($4::date IS NULL OR payment_date <= $4::date)`;

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
    return queryOne<PaymentRow>(db, 'SELECT * FROM payments WHERE id = $1', [id]);
  }

  list(f: PaymentFilter, limit: number, offset: number, db: Db = this.pool) {
    return queryMany<PaymentRow>(
      db,
      `SELECT * FROM payments ${FILTER} ORDER BY payment_date DESC, created_at DESC LIMIT $5 OFFSET $6`,
      [f.status, f.memberId, f.from, f.to, limit, offset],
    );
  }

  async count(f: PaymentFilter, db: Db = this.pool): Promise<number> {
    const row = await queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM payments ${FILTER}`, [f.status, f.memberId, f.from, f.to]);
    return row!.count;
  }

  async insert(req: CreatePaymentInput, db: Db = this.pool): Promise<PaymentRow> {
    const row = await queryOne<PaymentRow>(
      db,
      `INSERT INTO payments (member_id, membership_id, amount, payment_method, payment_date, status, reference, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        req.memberId, req.membershipId ?? null, req.amount, req.paymentMethod, req.paymentDate,
        req.status ?? 'COMPLETED', req.reference ?? null, req.notes ?? null,
      ],
    );
    return row!;
  }
}
