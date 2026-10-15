import { auditLog } from '../../common/audit.js';
import { nextCode } from '../../common/codegen.js';
import { badRequest, businessRule, conflict, notFound } from '../../common/errors.js';
import { newPage, pageOffset, type PageQuery } from '../../common/pagination.js';
import { isForeignKeyViolation, withTx, type DbPool } from '../../db/pool.js';
import type { ExpenseCategoryRepository } from './expense-category.repository.js';
import { decimalString, toCategoryResponse, toExpenseResponse } from './expense.model.js';
import type { ExpenseRepository } from './expense.repository.js';
import type { CategoryInput, CreateCategoryInput, ExpenseInput, ExpenseUpdateInput } from './expense.schemas.js';

const isPositive = (s: string) => Number(s) > 0;

/** Business rules, transactions and audit for expenses and their categories. No SQL, no HTTP. */
export class ExpenseService {
  constructor(
    private readonly pool: DbPool,
    private readonly categories: ExpenseCategoryRepository,
    private readonly expenses: ExpenseRepository,
  ) {}

  async listCategories() {
    return (await this.categories.list()).map(toCategoryResponse);
  }

  async createCategory(actor: string, req: CreateCategoryInput) {
    const c = await withTx(this.pool, async (tx) => {
      const row = await this.categories.insert(req, tx);
      await auditLog(tx, {
        userId: actor, action: 'CREATE', entityType: 'EXPENSE', entityId: row.id, entityName: row.name,
        description: 'Created expense category',
      });
      return row;
    });
    return toCategoryResponse(c);
  }

  async updateCategory(actor: string, id: string, req: CategoryInput) {
    const c = await withTx(this.pool, async (tx) => {
      const row = await this.categories.update(id, req, tx);
      if (!row) throw notFound('CATEGORY_NOT_FOUND', 'Category not found.');
      await auditLog(tx, {
        userId: actor, action: 'UPDATE', entityType: 'EXPENSE', entityId: row.id, entityName: row.name,
        description: 'Updated expense category',
      });
      return row;
    });
    return toCategoryResponse(c);
  }

  async deleteCategory(actor: string, id: string) {
    await withTx(this.pool, async (tx) => {
      try {
        await this.categories.delete(id, tx);
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
    const row = await this.expenses.findById(id);
    if (!row) throw notFound('EXPENSE_NOT_FOUND', 'Expense not found.');
    return toExpenseResponse(row);
  }

  async listExpenses(q: PageQuery, f: { categoryId?: string; from?: string; to?: string }) {
    const checkDate = (v: string | undefined, name: string) => {
      if (v !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw badRequest('INVALID_DATE', `${name} must be YYYY-MM-DD`);
    };
    checkDate(f.from, 'fromDate');
    checkDate(f.to, 'toDate');
    const rows = await this.expenses.list(f, q.pageSize, pageOffset(q));
    const total = await this.expenses.count(f);
    return newPage(rows.map(toExpenseResponse), q.page, q.pageSize, total);
  }

  async createExpense(actor: string, req: ExpenseInput) {
    if (!isPositive(req.amount)) throw badRequest('INVALID_AMOUNT', 'Amount must be greater than zero.');
    const cat = await this.categories.findById(req.categoryId);
    if (!cat) throw notFound('CATEGORY_NOT_FOUND', 'Expense category not found.');
    if (cat.status !== 'ACTIVE') throw businessRule('CATEGORY_INACTIVE', 'Cannot use an inactive category.');

    const created = await withTx(this.pool, async (tx) => {
      const code = await nextCode(tx, 'expense');
      const e = await this.expenses.insert(code, req, tx);
      await auditLog(tx, {
        userId: actor, action: 'CREATE', entityType: 'EXPENSE', entityId: e.id,
        description: `Expense ${decimalString(req.amount)} ${req.paymentMethod}`,
      });
      return e;
    });
    return toExpenseResponse(created);
  }

  async updateExpense(actor: string, id: string, req: ExpenseUpdateInput) {
    if (req.amount != null && !isPositive(req.amount)) throw badRequest('INVALID_AMOUNT', 'Amount must be greater than zero.');
    const out = await withTx(this.pool, async (tx) => {
      const e = await this.expenses.update(id, req, tx);
      if (!e) throw notFound('EXPENSE_NOT_FOUND', 'Expense not found.');
      await auditLog(tx, { userId: actor, action: 'UPDATE', entityType: 'EXPENSE', entityId: e.id, description: 'Updated expense' });
      return e;
    });
    return toExpenseResponse(out);
  }

  /** Like the Go service, deleting a non-existent id is not an error (still audited). */
  async deleteExpense(actor: string, id: string) {
    await withTx(this.pool, async (tx) => {
      await this.expenses.delete(id, tx);
      await auditLog(tx, { userId: actor, action: 'DELETE', entityType: 'EXPENSE', entityId: id, description: 'Deleted expense' });
    });
  }
}
