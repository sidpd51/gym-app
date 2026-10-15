import { auditLog } from '../../common/audit.js';
import { badRequest, notFound } from '../../common/errors.js';
import { newPage, pageOffset, type PageQuery } from '../../common/pagination.js';
import { dateString } from '../../common/validate.js';
import { isForeignKeyViolation, withTx, type DbPool } from '../../db/pool.js';
import { decimalOut, isPositive } from '../plan/plan.model.js';
import { toPaymentResponse } from './payment.model.js';
import type { PaymentRepository } from './payment.repository.js';
import type { CreatePaymentInput } from './payment.schemas.js';

function checkDate(v: string | undefined, field: string): string | null {
  if (!v) return null;
  if (!dateString.safeParse(v).success) throw badRequest('INVALID_DATE', `${field} must be YYYY-MM-DD`);
  return v;
}

/** Business rules, transactions and audit for payments. */
export class PaymentService {
  constructor(
    private readonly pool: DbPool,
    private readonly repo: PaymentRepository,
  ) {}

  async getById(id: string) {
    const row = await this.repo.findById(id);
    if (!row) throw notFound('PAYMENT_NOT_FOUND', 'Payment not found.');
    return toPaymentResponse(row);
  }

  async list(q: PageQuery, f: { status?: string; memberId?: string; from?: string; to?: string }) {
    const filter = {
      status: f.status || null,
      memberId: f.memberId || null,
      from: checkDate(f.from, 'fromDate'),
      to: checkDate(f.to, 'toDate'),
    };
    const rows = await this.repo.list(filter, q.pageSize, pageOffset(q));
    const total = await this.repo.count(filter);
    return newPage(rows.map(toPaymentResponse), q.page, q.pageSize, total);
  }

  async create(actor: string, req: CreatePaymentInput) {
    if (!isPositive(req.amount)) throw badRequest('INVALID_AMOUNT', 'Amount must be greater than zero.');
    const created = await withTx(this.pool, async (tx) => {
      let p;
      try {
        p = await this.repo.insert(req, tx);
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
