import { exec, newId, queryMany, queryOne, type Db, type DbPool } from '../../db/pool.js';
import type { CategoryRow } from './inventory.model.js';
import type { CategoryInput, CreateCategoryInput } from './inventory.schemas.js';

/** Data access for `inventory_categories`. SQL only; no business rules. */
export class InventoryCategoryRepository {
  constructor(private readonly pool: DbPool) {}

  list(db: Db = this.pool) {
    return queryMany<CategoryRow>(db, 'SELECT * FROM inventory_categories ORDER BY name ASC');
  }

  async insert(req: CreateCategoryInput, db: Db = this.pool): Promise<CategoryRow> {
    const id = newId();
    await exec(
      db,
      'INSERT INTO inventory_categories (id, name, description, status) VALUES (?, ?, ?, ?)',
      [id, req.name, req.description ?? null, req.status ?? 'ACTIVE'],
    );
    return (await queryOne<CategoryRow>(db, 'SELECT * FROM inventory_categories WHERE id = ?', [id]))!;
  }

  /** Partial update; empty name means unchanged. Undefined result = no such category. */
  async update(id: string, req: CategoryInput, db: Db = this.pool) {
    const matched = await exec(
      db,
      `UPDATE inventory_categories
       SET name = COALESCE(?, name), description = COALESCE(?, description),
           status = COALESCE(?, status)
       WHERE id = ?`,
      [req.name || null, req.description ?? null, req.status ?? null, id],
    );
    return matched ? queryOne<CategoryRow>(db, 'SELECT * FROM inventory_categories WHERE id = ?', [id]) : undefined;
  }

  delete(id: string, db: Db = this.pool) {
    return exec(db, 'DELETE FROM inventory_categories WHERE id = ?', [id]);
  }
}
