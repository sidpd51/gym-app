import { auditLog } from '../../common/audit.js';
import { nextCode } from '../../common/codegen.js';
import { badRequest, businessRule, conflict, notFound } from '../../common/errors.js';
import { newPage, pageOffset, type PageQuery } from '../../common/pagination.js';
import { exec, isForeignKeyViolation, queryMany, queryOne, withTx, type DbPool } from '../../db/pool.js';

interface CategoryRow { id: string; name: string; description: string | null; status: string }
interface ItemRow {
  id: string; item_code: string; name: string; category_id: string; unit: string; current_stock: number;
  minimum_stock: number; status: string; description: string | null; created_at: Date;
}
interface TxRow {
  id: string; item_id: string; type: string; quantity: number; transaction_date: string;
  reference: string | null; notes: string | null; created_at: Date;
}

export interface CategoryInput { name?: string | null; description?: string | null; status?: string | null }
export interface ItemInput {
  name: string; categoryId: string; unit: string; currentStock: number; minimumStock: number; description?: string | null;
}
export interface ItemUpdateInput {
  name?: string | null; unit?: string | null; minimumStock?: number | null; description?: string | null;
}
export interface TransactionInput {
  type: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT'; quantity: number; transactionDate: string;
  reference?: string | null; notes?: string | null;
}

export function statusFor(current: number, minimum: number): string {
  if (current <= 0) return 'OUT_OF_STOCK';
  if (current <= minimum) return 'LOW_STOCK';
  return 'IN_STOCK';
}

const catResponse = (c: CategoryRow) => ({ id: c.id, name: c.name, description: c.description, status: c.status });
const itemResponse = (it: ItemRow) => ({
  id: it.id, itemCode: it.item_code, name: it.name, categoryId: it.category_id, unit: it.unit,
  currentStock: it.current_stock, minimumStock: it.minimum_stock, status: it.status,
  description: it.description, createdAt: it.created_at,
});
const txResponse = (t: TxRow) => ({
  id: t.id, itemId: t.item_id, type: t.type, quantity: t.quantity, transactionDate: t.transaction_date,
  reference: t.reference, notes: t.notes, createdAt: t.created_at,
});

export class InventoryService {
  constructor(private readonly pool: DbPool) {}

  // --- categories ---

  async listCategories() {
    return (await queryMany<CategoryRow>(this.pool, 'SELECT * FROM inventory_categories ORDER BY name ASC')).map(catResponse);
  }

  async createCategory(actor: string, req: CategoryInput) {
    const c = await withTx(this.pool, async (tx) => {
      const row = (await queryOne<CategoryRow>(
        tx,
        'INSERT INTO inventory_categories (name, description, status) VALUES ($1, $2, $3) RETURNING *',
        [req.name, req.description ?? null, req.status ?? 'ACTIVE'],
      ))!;
      await auditLog(tx, {
        userId: actor, action: 'CREATE', entityType: 'INVENTORY_ITEM', entityId: row.id, entityName: row.name,
        description: 'Created inventory category',
      });
      return row;
    });
    return catResponse(c);
  }

  async updateCategory(actor: string, id: string, req: CategoryInput) {
    const c = await withTx(this.pool, async (tx) => {
      const row = await queryOne<CategoryRow>(
        tx,
        `UPDATE inventory_categories
         SET name = COALESCE($2, name), description = COALESCE($3, description),
             status = COALESCE($4::category_status, status)
         WHERE id = $1 RETURNING *`,
        [id, req.name || null, req.description ?? null, req.status ?? null],
      );
      if (!row) throw notFound('CATEGORY_NOT_FOUND', 'Category not found.');
      await auditLog(tx, {
        userId: actor, action: 'UPDATE', entityType: 'INVENTORY_ITEM', entityId: row.id, entityName: row.name,
        description: 'Updated inventory category',
      });
      return row;
    });
    return catResponse(c);
  }

  async deleteCategory(actor: string, id: string) {
    await withTx(this.pool, async (tx) => {
      try {
        await exec(tx, 'DELETE FROM inventory_categories WHERE id = $1', [id]);
      } catch (err) {
        if (isForeignKeyViolation(err)) throw conflict('CATEGORY_REFERENCED', 'This category has items and cannot be deleted.');
        throw err;
      }
      await auditLog(tx, {
        userId: actor, action: 'DELETE', entityType: 'INVENTORY_ITEM', entityId: id, description: 'Deleted inventory category',
      });
    });
  }

  // --- items ---

  async getItem(id: string) {
    const row = await queryOne<ItemRow>(this.pool, 'SELECT * FROM inventory_items WHERE id = $1', [id]);
    if (!row) throw notFound('ITEM_NOT_FOUND', 'Item not found.');
    return itemResponse(row);
  }

  async listItems(q: PageQuery, f: { status?: string; categoryId?: string }) {
    const where = `WHERE ($1::inventory_status IS NULL OR status = $1::inventory_status)
      AND ($2::uuid IS NULL OR category_id = $2::uuid)`;
    const params = [f.status ?? null, f.categoryId ?? null];
    const rows = await queryMany<ItemRow>(
      this.pool,
      `SELECT * FROM inventory_items ${where} ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
      [...params, q.pageSize, pageOffset(q)],
    );
    const total = (await queryOne<{ count: number }>(this.pool, `SELECT COUNT(*) FROM inventory_items ${where}`, params))!.count;
    return newPage(rows.map(itemResponse), q.page, q.pageSize, total);
  }

  async createItem(actor: string, req: ItemInput) {
    const out = await withTx(this.pool, async (tx) => {
      const code = await nextCode(tx, 'inventoryItem');
      let it: ItemRow;
      try {
        it = (await queryOne<ItemRow>(
          tx,
          `INSERT INTO inventory_items (item_code, name, category_id, unit, current_stock, minimum_stock, status, description)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
          [code, req.name, req.categoryId, req.unit, req.currentStock, req.minimumStock,
           statusFor(req.currentStock, req.minimumStock), req.description ?? null],
        ))!;
      } catch (err) {
        if (isForeignKeyViolation(err)) throw badRequest('INVALID_REFERENCE', 'Category not found.');
        throw err;
      }
      await auditLog(tx, {
        userId: actor, action: 'CREATE', entityType: 'INVENTORY_ITEM', entityId: it.id, entityName: it.name,
        description: `Created item ${it.item_code}`,
      });
      return it;
    });
    return itemResponse(out);
  }

  async updateItem(actor: string, id: string, req: ItemUpdateInput) {
    const out = await withTx(this.pool, async (tx) => {
      const it = await queryOne<ItemRow>(
        tx,
        `UPDATE inventory_items
         SET name = COALESCE($2, name), unit = COALESCE($3, unit),
             minimum_stock = COALESCE($4, minimum_stock), description = COALESCE($5, description),
             updated_at = NOW()
         WHERE id = $1 RETURNING *`,
        [id, req.name ?? null, req.unit ?? null, req.minimumStock ?? null, req.description ?? null],
      );
      if (!it) throw notFound('ITEM_NOT_FOUND', 'Item not found.');
      await auditLog(tx, {
        userId: actor, action: 'UPDATE', entityType: 'INVENTORY_ITEM', entityId: it.id, entityName: it.name,
        description: 'Updated item',
      });
      return it;
    });
    return itemResponse(out);
  }

  async deleteItem(actor: string, id: string) {
    await withTx(this.pool, async (tx) => {
      try {
        await exec(tx, 'DELETE FROM inventory_items WHERE id = $1', [id]);
      } catch (err) {
        if (isForeignKeyViolation(err)) throw conflict('ITEM_REFERENCED', 'This item has transactions and cannot be deleted.');
        throw err;
      }
      await auditLog(tx, { userId: actor, action: 'DELETE', entityType: 'INVENTORY_ITEM', entityId: id, description: 'Deleted item' });
    });
  }

  // --- transactions ---

  async listTransactions(itemId: string) {
    const rows = await queryMany<TxRow>(
      this.pool,
      'SELECT * FROM inventory_transactions WHERE item_id = $1 ORDER BY transaction_date DESC, created_at DESC',
      [itemId],
    );
    return rows.map(txResponse);
  }

  /** Stock update + transaction insert atomically; FOR UPDATE serialises concurrent writers. */
  async recordTransaction(actor: string, itemId: string, req: TransactionInput) {
    const out = await withTx(this.pool, async (tx) => {
      const it = await queryOne<ItemRow>(tx, 'SELECT * FROM inventory_items WHERE id = $1 FOR UPDATE', [itemId]);
      if (!it) throw notFound('ITEM_NOT_FOUND', 'Item not found.');
      let newStock: number;
      switch (req.type) {
        case 'STOCK_IN':
          newStock = it.current_stock + req.quantity;
          break;
        case 'STOCK_OUT':
          if (it.current_stock - req.quantity < 0) {
            throw businessRule('INVENTORY_INSUFFICIENT_STOCK', 'Not enough stock to complete the STOCK_OUT.');
          }
          newStock = it.current_stock - req.quantity;
          break;
        default: // ADJUSTMENT sets stock to the given absolute level
          newStock = req.quantity;
      }
      await exec(
        tx,
        'UPDATE inventory_items SET current_stock = $2, status = $3, updated_at = NOW() WHERE id = $1',
        [itemId, newStock, statusFor(newStock, it.minimum_stock)],
      );
      const txn = (await queryOne<TxRow>(
        tx,
        `INSERT INTO inventory_transactions (item_id, type, quantity, transaction_date, reference, notes)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [itemId, req.type, req.quantity, req.transactionDate, req.reference ?? null, req.notes ?? null],
      ))!;
      await auditLog(tx, {
        userId: actor, action: 'CREATE', entityType: 'INVENTORY_ITEM', entityId: itemId, entityName: it.name,
        description: `Inventory ${req.type} qty=${req.quantity}`,
      });
      return txn;
    });
    return txResponse(out);
  }
}
