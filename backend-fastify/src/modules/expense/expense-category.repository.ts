import { exec, newId, queryMany, queryOne, type Db, type DbPool } from '../../db/pool.js';
import type { CategoryRow } from './expense.model.js';
import type { CategoryInput, CreateCategoryInput } from './expense.schemas.js';

/** Data access for `expense_categories`. SQL only; no business rules. */
export class ExpenseCategoryRepository {
  constructor(private readonly pool: DbPool) {}

  list(db: Db = this.pool) {
    return queryMany<CategoryRow>(db, 'SELECT * FROM expense_categories ORDER BY name ASC');
  }

  findById(id: string, db: Db = this.pool) {
    return queryOne<CategoryRow>(db, 'SELECT * FROM expense_categories WHERE id = ?', [id]);
  }

  async insert(req: CreateCategoryInput, db: Db = this.pool): Promise<CategoryRow> {
    const id = newId();
    await exec(
      db,
      'INSERT INTO expense_categories (id, name, description, status) VALUES (?, ?, ?, ?)',
      [id, req.name, req.description ?? null, req.status ?? 'ACTIVE'],
    );
    return (await queryOne<CategoryRow>(db, 'SELECT * FROM expense_categories WHERE id = ?', [id]))!;
  }

  /** Partial update; empty name means unchanged. Undefined result = no such category. */
  async update(id: string, req: CategoryInput, db: Db = this.pool) {
    const matched = await exec(
      db,
      `UPDATE expense_categories
       SET name = COALESCE(?, name), description = COALESCE(?, description),
           status = COALESCE(?, status)
       WHERE id = ?`,
      [req.name || null, req.description ?? null, req.status ?? null, id],
    );
    return matched ? queryOne<CategoryRow>(db, 'SELECT * FROM expense_categories WHERE id = ?', [id]) : undefined;
  }

  delete(id: string, db: Db = this.pool) {
    return exec(db, 'DELETE FROM expense_categories WHERE id = ?', [id]);
  }
}
