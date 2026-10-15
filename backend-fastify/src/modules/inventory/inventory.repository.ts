import { exec, queryMany, queryOne, type Db, type DbPool } from '../../db/pool.js';
import type { ItemRow, TxRow } from './inventory.model.js';
import type { ItemUpdateInput, TransactionInput } from './inventory.schemas.js';

export interface ItemFilter {
  status?: string;
  categoryId?: string;
}

export interface NewItem {
  code: string;
  name: string;
  categoryId: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  status: string;
  description?: string | null;
}

const FILTER = `WHERE ($1::inventory_status IS NULL OR status = $1::inventory_status)
  AND ($2::uuid IS NULL OR category_id = $2::uuid)`;

const filterParams = (f: ItemFilter) => [f.status ?? null, f.categoryId ?? null];

/** Data access for `inventory_items` and `inventory_transactions`. SQL only; no business rules. */
export class InventoryRepository {
  constructor(private readonly pool: DbPool) {}

  findById(id: string, db: Db = this.pool) {
    return queryOne<ItemRow>(db, 'SELECT * FROM inventory_items WHERE id = $1', [id]);
  }

  /** Locks the row so concurrent stock writers serialise. */
  findByIdForUpdate(id: string, db: Db = this.pool) {
    return queryOne<ItemRow>(db, 'SELECT * FROM inventory_items WHERE id = $1 FOR UPDATE', [id]);
  }

  list(f: ItemFilter, limit: number, offset: number, db: Db = this.pool) {
    return queryMany<ItemRow>(
      db,
      `SELECT * FROM inventory_items ${FILTER} ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
      [...filterParams(f), limit, offset],
    );
  }

  async count(f: ItemFilter, db: Db = this.pool): Promise<number> {
    const row = await queryOne<{ count: number }>(db, `SELECT COUNT(*) FROM inventory_items ${FILTER}`, filterParams(f));
    return row!.count;
  }

  async insert(it: NewItem, db: Db = this.pool): Promise<ItemRow> {
    const row = await queryOne<ItemRow>(
      db,
      `INSERT INTO inventory_items (item_code, name, category_id, unit, current_stock, minimum_stock, status, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [it.code, it.name, it.categoryId, it.unit, it.currentStock, it.minimumStock, it.status, it.description ?? null],
    );
    return row!;
  }

  update(id: string, req: ItemUpdateInput, db: Db = this.pool) {
    return queryOne<ItemRow>(
      db,
      `UPDATE inventory_items
       SET name = COALESCE($2, name), unit = COALESCE($3, unit),
           minimum_stock = COALESCE($4, minimum_stock), description = COALESCE($5, description),
           updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id, req.name ?? null, req.unit ?? null, req.minimumStock ?? null, req.description ?? null],
    );
  }

  updateStock(id: string, stock: number, status: string, db: Db = this.pool) {
    return exec(db, 'UPDATE inventory_items SET current_stock = $2, status = $3, updated_at = NOW() WHERE id = $1', [id, stock, status]);
  }

  delete(id: string, db: Db = this.pool) {
    return exec(db, 'DELETE FROM inventory_items WHERE id = $1', [id]);
  }

  listTransactions(itemId: string, db: Db = this.pool) {
    return queryMany<TxRow>(
      db,
      'SELECT * FROM inventory_transactions WHERE item_id = $1 ORDER BY transaction_date DESC, created_at DESC',
      [itemId],
    );
  }

  async insertTransaction(itemId: string, req: TransactionInput, db: Db = this.pool): Promise<TxRow> {
    const row = await queryOne<TxRow>(
      db,
      `INSERT INTO inventory_transactions (item_id, type, quantity, transaction_date, reference, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [itemId, req.type, req.quantity, req.transactionDate, req.reference ?? null, req.notes ?? null],
    );
    return row!;
  }
}
