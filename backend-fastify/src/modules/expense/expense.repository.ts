import { exec, queryMany, queryOne, type Db, type DbPool } from '../../db/pool.js';
import type { ExpenseRow } from './expense.model.js';
import type { ExpenseInput, ExpenseUpdateInput } from './expense.schemas.js';

export interface ExpenseFilter {
  categoryId?: string;
  from?: string;
  to?: string;
}

const FILTER = `WHERE ($1::uuid IS NULL OR category_id = $1::uuid)
  AND ($2::date IS NULL OR expense_date >= $2::date)
  AND ($3::date IS NULL OR expense_date <= $3::date)`;

const filterParams = (f: ExpenseFilter) => [f.categoryId ?? null, f.from ?? null, f.to ?? null];

/** Data access for `expenses`. SQL only; no business rules. */
export class ExpenseRepository {
  constructor(private readonly pool: DbPool) {}

  findById(id: string, db: Db = this.pool) {
    return queryOne<ExpenseRow>(db, 'SELECT * FROM expenses WHERE id = $1', [id]);
  }

  list(f: ExpenseFilter, limit: number, offset: number, db: Db = this.pool) {
    return queryMany<ExpenseRow>(
      db,
      `SELECT * FROM expenses ${FILTER} ORDER BY expense_date DESC, created_at DESC LIMIT $4 OFFSET $5`,
      [...filterParams(f), limit, offset],
    );
  }

  async count(f: ExpenseFilter, db: Db = this.pool): Promise<number> {
    const row = await queryOne<{ count: number }>(db, `SELECT COUNT(*) FROM expenses ${FILTER}`, filterParams(f));
    return row!.count;
  }

  async insert(code: string, req: ExpenseInput, db: Db = this.pool): Promise<ExpenseRow> {
    const row = await queryOne<ExpenseRow>(
      db,
      `INSERT INTO expenses (expense_code, category_id, description, amount, expense_date, payment_method, vendor, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [code, req.categoryId, req.description, req.amount, req.expenseDate, req.paymentMethod, req.vendor ?? null, req.notes ?? null],
    );
    return row!;
  }

  update(id: string, req: ExpenseUpdateInput, db: Db = this.pool) {
    return queryOne<ExpenseRow>(
      db,
      `UPDATE expenses
       SET category_id = COALESCE($2, category_id), description = COALESCE($3, description),
           amount = COALESCE($4, amount), expense_date = COALESCE($5, expense_date),
           payment_method = COALESCE($6::expense_payment_method, payment_method),
           vendor = COALESCE($7, vendor), notes = COALESCE($8, notes)
       WHERE id = $1 RETURNING *`,
      [id, req.categoryId ?? null, req.description ?? null, req.amount ?? null, req.expenseDate ?? null,
       req.paymentMethod ?? null, req.vendor ?? null, req.notes ?? null],
    );
  }

  delete(id: string, db: Db = this.pool) {
    return exec(db, 'DELETE FROM expenses WHERE id = $1', [id]);
  }
}
