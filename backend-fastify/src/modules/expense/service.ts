import { auditLog } from '../../common/audit.js';
import { nextCode } from '../../common/codegen.js';
import { badRequest, businessRule, conflict, notFound } from '../../common/errors.js';
import { newPage, pageOffset, type PageQuery } from '../../common/pagination.js';
import { exec, isForeignKeyViolation, queryMany, queryOne, withTx, type DbPool } from '../../db/pool.js';

interface CategoryRow { id: string; name: string; description: string | null; status: string }
interface ExpenseRow {
  id: string; expense_code: string; category_id: string; description: string; amount: string;
  expense_date: string; payment_method: string; vendor: string | null; notes: string | null; created_at: Date;
}

export interface CategoryInput { name?: string | null; description?: string | null; status?: string | null }
export interface ExpenseInput {
  categoryId: string; description: string; amount: string; expenseDate: string;
  paymentMethod: string; vendor?: string | null; notes?: string | null;
}
export interface ExpenseUpdateInput {
  categoryId?: string | null; description?: string | null; amount?: string | null; expenseDate?: string | null;
  paymentMethod?: string | null; vendor?: string | null; notes?: string | null;
}

const catResponse = (c: CategoryRow) => ({ id: c.id, name: c.name, description: c.description, status: c.status });

/** Go's decimal.Decimal JSON is a string without trailing zeros ("100.00" -> "100"). */
export function decimalString(s: string): string {
  return s.includes('.') ? s.replace(/\.?0+$/, '') : s;
}

const expResponse = (e: ExpenseRow) => ({
  id: e.id,
  expenseCode: e.expense_code,
  categoryId: e.category_id,
  description: e.description,
  amount: decimalString(e.amount),
  expenseDate: e.expense_date,
  paymentMethod: e.payment_method,
  vendor: e.vendor,
  notes: e.notes,
  createdAt: e.created_at,
});

const isPositive = (s: string) => Number(s) > 0;

export class ExpenseService {
  constructor(private readonly pool: DbPool) {}

  async listCategories() {
    const rows = await queryMany<CategoryRow>(this.pool, 'SELECT * FROM expense_categories ORDER BY name ASC');
    return rows.map(catResponse);
  }

  async createCategory(actor: string, req: CategoryInput) {
    const c = await withTx(this.pool, async (tx) => {
      const row = (await queryOne<CategoryRow>(
        tx,
        'INSERT INTO expense_categories (name, description, status) VALUES ($1, $2, $3) RETURNING *',
        [req.name, req.description ?? null, req.status ?? 'ACTIVE'],
      ))!;
      await auditLog(tx, {
        userId: actor, action: 'CREATE', entityType: 'EXPENSE', entityId: row.id, entityName: row.name,
        description: 'Created expense category',
      });
      return row;
    });
    return catResponse(c);
  }

  async updateCategory(actor: string, id: string, req: CategoryInput) {
    const c = await withTx(this.pool, async (tx) => {
      const row = await queryOne<CategoryRow>(
        tx,
        `UPDATE expense_categories
         SET name = COALESCE($2, name), description = COALESCE($3, description),
             status = COALESCE($4::category_status, status)
         WHERE id = $1 RETURNING *`,
        [id, req.name || null, req.description ?? null, req.status ?? null],
      );
      if (!row) throw notFound('CATEGORY_NOT_FOUND', 'Category not found.');
      await auditLog(tx, {
        userId: actor, action: 'UPDATE', entityType: 'EXPENSE', entityId: row.id, entityName: row.name,
        description: 'Updated expense category',
      });
      return row;
    });
    return catResponse(c);
  }

  async deleteCategory(actor: string, id: string) {
    await withTx(this.pool, async (tx) => {
      try {
        await exec(tx, 'DELETE FROM expense_categories WHERE id = $1', [id]);
      } catch (err) {
        if (isForeignKeyViolation(err)) {
          throw conflict('CATEGORY_REFERENCED', 'This category has expenses and cannot be deleted.');
        }
        throw err;
      }
      await auditLog(tx, {
        userId: actor, action: 'DELETE', entityType: 'EXPENSE', entityId: id, description: 'Deleted expense category',
      });
    });
  }

  async getExpense(id: string) {
    const row = await queryOne<ExpenseRow>(this.pool, 'SELECT * FROM expenses WHERE id = $1', [id]);
    if (!row) throw notFound('EXPENSE_NOT_FOUND', 'Expense not found.');
    return expResponse(row);
  }

  async listExpenses(q: PageQuery, f: { categoryId?: string; from?: string; to?: string }) {
    const checkDate = (v: string | undefined, name: string) => {
      if (v !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw badRequest('INVALID_DATE', `${name} must be YYYY-MM-DD`);
    };
    checkDate(f.from, 'fromDate');
    checkDate(f.to, 'toDate');
    const where = `WHERE ($1::uuid IS NULL OR category_id = $1::uuid)
      AND ($2::date IS NULL OR expense_date >= $2::date)
      AND ($3::date IS NULL OR expense_date <= $3::date)`;
    const params = [f.categoryId ?? null, f.from ?? null, f.to ?? null];
    const rows = await queryMany<ExpenseRow>(
      this.pool,
      `SELECT * FROM expenses ${where} ORDER BY expense_date DESC, created_at DESC LIMIT $4 OFFSET $5`,
      [...params, q.pageSize, pageOffset(q)],
    );
    const total = (await queryOne<{ count: number }>(this.pool, `SELECT COUNT(*) FROM expenses ${where}`, params))!.count;
    return newPage(rows.map(expResponse), q.page, q.pageSize, total);
  }

  async createExpense(actor: string, req: ExpenseInput) {
    if (!isPositive(req.amount)) throw badRequest('INVALID_AMOUNT', 'Amount must be greater than zero.');
    const cat = await queryOne<CategoryRow>(this.pool, 'SELECT * FROM expense_categories WHERE id = $1', [req.categoryId]);
    if (!cat) throw notFound('CATEGORY_NOT_FOUND', 'Expense category not found.');
    if (cat.status !== 'ACTIVE') throw businessRule('CATEGORY_INACTIVE', 'Cannot use an inactive category.');

    const created = await withTx(this.pool, async (tx) => {
      const code = await nextCode(tx, 'expense');
      const e = (await queryOne<ExpenseRow>(
        tx,
        `INSERT INTO expenses (expense_code, category_id, description, amount, expense_date, payment_method, vendor, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [code, req.categoryId, req.description, req.amount, req.expenseDate, req.paymentMethod, req.vendor ?? null, req.notes ?? null],
      ))!;
      await auditLog(tx, {
        userId: actor, action: 'CREATE', entityType: 'EXPENSE', entityId: e.id,
        description: `Expense ${decimalString(req.amount)} ${req.paymentMethod}`,
      });
      return e;
    });
    return expResponse(created);
  }

  async updateExpense(actor: string, id: string, req: ExpenseUpdateInput) {
    if (req.amount != null && !isPositive(req.amount)) throw badRequest('INVALID_AMOUNT', 'Amount must be greater than zero.');
    const out = await withTx(this.pool, async (tx) => {
      const e = await queryOne<ExpenseRow>(
        tx,
        `UPDATE expenses
         SET category_id = COALESCE($2, category_id), description = COALESCE($3, description),
             amount = COALESCE($4, amount), expense_date = COALESCE($5, expense_date),
             payment_method = COALESCE($6::expense_payment_method, payment_method),
             vendor = COALESCE($7, vendor), notes = COALESCE($8, notes)
         WHERE id = $1 RETURNING *`,
        [id, req.categoryId ?? null, req.description ?? null, req.amount ?? null, req.expenseDate ?? null,
         req.paymentMethod ?? null, req.vendor ?? null, req.notes ?? null],
      );
      if (!e) throw notFound('EXPENSE_NOT_FOUND', 'Expense not found.');
      await auditLog(tx, { userId: actor, action: 'UPDATE', entityType: 'EXPENSE', entityId: e.id, description: 'Updated expense' });
      return e;
    });
    return expResponse(out);
  }

  /** Like the Go service, deleting a non-existent id is not an error (still audited). */
  async deleteExpense(actor: string, id: string) {
    await withTx(this.pool, async (tx) => {
      await exec(tx, 'DELETE FROM expenses WHERE id = $1', [id]);
      await auditLog(tx, { userId: actor, action: 'DELETE', entityType: 'EXPENSE', entityId: id, description: 'Deleted expense' });
    });
  }
}
