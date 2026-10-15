import { exec, queryMany, queryOne, type Db, type DbPool } from '../../db/pool.js';
import type { CategoryRow } from './inventory.model.js';
import type { CategoryInput, CreateCategoryInput } from './inventory.schemas.js';

/** Data access for `inventory_categories`. SQL only; no business rules. */
export class InventoryCategoryRepository {
  constructor(private readonly pool: DbPool) {}

  list(db: Db = this.pool) {
    return queryMany<CategoryRow>(db, 'SELECT * FROM inventory_categories ORDER BY name ASC');
  }

  async insert(req: CreateCategoryInput, db: Db = this.pool): Promise<CategoryRow> {
    const row = await queryOne<CategoryRow>(
      db,
      'INSERT INTO inventory_categories (name, description, status) VALUES ($1, $2, $3) RETURNING *',
      [req.name, req.description ?? null, req.status ?? 'ACTIVE'],
    );
    return row!;
  }

  /** Partial update; empty name means unchanged. Undefined result = no such category. */
  update(id: string, req: CategoryInput, db: Db = this.pool) {
    return queryOne<CategoryRow>(
      db,
      `UPDATE inventory_categories
       SET name = COALESCE($2, name), description = COALESCE($3, description),
           status = COALESCE($4::category_status, status)
       WHERE id = $1 RETURNING *`,
      [id, req.name || null, req.description ?? null, req.status ?? null],
    );
  }

  delete(id: string, db: Db = this.pool) {
    return exec(db, 'DELETE FROM inventory_categories WHERE id = $1', [id]);
  }
}
