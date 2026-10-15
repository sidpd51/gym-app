import { exec, newId, queryMany, queryOne, type Db, type DbPool } from '../../db/pool.js';
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

const FILTER = `WHERE (? IS NULL OR status = ?) AND (? IS NULL OR category_id = ?)`;

const filterParams = (f: ItemFilter) => {
  const s = f.status ?? null;
  const c = f.categoryId ?? null;
  return [s, s, c, c];
};

/** Data access for `inventory_items` and `inventory_transactions`. SQL only; no business rules. */
export class InventoryRepository {
  constructor(private readonly pool: DbPool) {}

  findById(id: string, db: Db = this.pool) {
    return queryOne<ItemRow>(db, 'SELECT * FROM inventory_items WHERE id = ?', [id]);
  }

  /** Locks the row so concurrent stock writers serialise. */
  findByIdForUpdate(id: string, db: Db = this.pool) {
    return queryOne<ItemRow>(db, 'SELECT * FROM inventory_items WHERE id = ? FOR UPDATE', [id]);
  }

  list(f: ItemFilter, limit: number, offset: number, db: Db = this.pool) {
    return queryMany<ItemRow>(
      db,
      `SELECT * FROM inventory_items ${FILTER} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...filterParams(f), limit, offset],
    );
  }

  async count(f: ItemFilter, db: Db = this.pool): Promise<number> {
    const row = await queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM inventory_items ${FILTER}`, filterParams(f));
    return row!.count;
  }

  async insert(it: NewItem, db: Db = this.pool): Promise<ItemRow> {
    const id = newId();
    await exec(
      db,
      `INSERT INTO inventory_items (id, item_code, name, category_id, unit, current_stock, minimum_stock, status, description)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [id, it.code, it.name, it.categoryId, it.unit, it.currentStock, it.minimumStock, it.status, it.description ?? null],
    );
    return (await this.findById(id, db))!;
  }

  async update(id: string, req: ItemUpdateInput, db: Db = this.pool) {
    const matched = await exec(
      db,
      `UPDATE inventory_items
       SET name = COALESCE(?, name), unit = COALESCE(?, unit),
           minimum_stock = COALESCE(?, minimum_stock), description = COALESCE(?, description),
           updated_at = NOW(3)
       WHERE id = ?`,
      [req.name ?? null, req.unit ?? null, req.minimumStock ?? null, req.description ?? null, id],
    );
    return matched ? this.findById(id, db) : undefined;
  }

  updateStock(id: string, stock: number, status: string, db: Db = this.pool) {
    return exec(db, 'UPDATE inventory_items SET current_stock = ?, status = ?, updated_at = NOW(3) WHERE id = ?', [stock, status, id]);
  }

  delete(id: string, db: Db = this.pool) {
    return exec(db, 'DELETE FROM inventory_items WHERE id = ?', [id]);
  }

  listTransactions(itemId: string, db: Db = this.pool) {
    return queryMany<TxRow>(
      db,
      'SELECT * FROM inventory_transactions WHERE item_id = ? ORDER BY transaction_date DESC, created_at DESC',
      [itemId],
    );
  }

  async insertTransaction(itemId: string, req: TransactionInput, db: Db = this.pool): Promise<TxRow> {
    const id = newId();
    await exec(
      db,
      `INSERT INTO inventory_transactions (id, item_id, type, quantity, transaction_date, reference, notes)
       VALUES (?,?,?,?,?,?,?)`,
      [id, itemId, req.type, req.quantity, req.transactionDate, req.reference ?? null, req.notes ?? null],
    );
    return (await queryOne<TxRow>(db, 'SELECT * FROM inventory_transactions WHERE id = ?', [id]))!;
  }
}
