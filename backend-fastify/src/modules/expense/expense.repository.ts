import { exec, newId, queryMany, queryOne, type Db, type DbPool } from '../../db/pool.js';
import type { ExpenseRow } from './expense.model.js';
import type { ExpenseInput, ExpenseUpdateInput } from './expense.schemas.js';

export interface ExpenseFilter {
  categoryId?: string;
  from?: string;
  to?: string;
}

const FILTER = `WHERE (? IS NULL OR category_id = ?)
  AND (? IS NULL OR expense_date >= ?)
  AND (? IS NULL OR expense_date <= ?)`;

const filterParams = (f: ExpenseFilter) => {
  const c = f.categoryId ?? null;
  const from = f.from ?? null;
  const to = f.to ?? null;
  return [c, c, from, from, to, to];
};

/** Data access for `expenses`. SQL only; no business rules. */
export class ExpenseRepository {
  constructor(private readonly pool: DbPool) {}

  findById(id: string, db: Db = this.pool) {
    return queryOne<ExpenseRow>(db, 'SELECT * FROM expenses WHERE id = ?', [id]);
  }

  list(f: ExpenseFilter, limit: number, offset: number, db: Db = this.pool) {
    return queryMany<ExpenseRow>(
      db,
      `SELECT * FROM expenses ${FILTER} ORDER BY expense_date DESC, created_at DESC LIMIT ? OFFSET ?`,
      [...filterParams(f), limit, offset],
    );
  }

  async count(f: ExpenseFilter, db: Db = this.pool): Promise<number> {
    const row = await queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM expenses ${FILTER}`, filterParams(f));
    return row!.count;
  }

  async insert(code: string, req: ExpenseInput, db: Db = this.pool): Promise<ExpenseRow> {
    const id = newId();
    await exec(
      db,
      `INSERT INTO expenses (id, expense_code, category_id, description, amount, expense_date, payment_method, vendor, notes)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [id, code, req.categoryId, req.description, req.amount, req.expenseDate, req.paymentMethod, req.vendor ?? null, req.notes ?? null],
    );
    return (await this.findById(id, db))!;
  }

  async update(id: string, req: ExpenseUpdateInput, db: Db = this.pool) {
    const matched = await exec(
      db,
      `UPDATE expenses
       SET category_id = COALESCE(?, category_id), description = COALESCE(?, description),
           amount = COALESCE(?, amount), expense_date = COALESCE(?, expense_date),
           payment_method = COALESCE(?, payment_method),
           vendor = COALESCE(?, vendor), notes = COALESCE(?, notes)
       WHERE id = ?`,
      [req.categoryId ?? null, req.description ?? null, req.amount ?? null, req.expenseDate ?? null,
       req.paymentMethod ?? null, req.vendor ?? null, req.notes ?? null, id],
    );
    return matched ? this.findById(id, db) : undefined;
  }

  delete(id: string, db: Db = this.pool) {
    return exec(db, 'DELETE FROM expenses WHERE id = ?', [id]);
  }
}
