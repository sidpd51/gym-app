import { auditLog } from '../../common/audit.js';
import { nextCode } from '../../common/codegen.js';
import { badRequest, businessRule, conflict, notFound } from '../../common/errors.js';
import { newPage, pageOffset, type PageQuery } from '../../common/pagination.js';
import { isForeignKeyViolation, withTx, type DbPool } from '../../db/pool.js';
import type { InventoryCategoryRepository } from './inventory-category.repository.js';
import { statusFor, toCategoryResponse, toItemResponse, toTransactionResponse, type ItemRow } from './inventory.model.js';
import type { InventoryRepository } from './inventory.repository.js';
import type {
  CategoryInput, CreateCategoryInput, ItemInput, ItemUpdateInput, TransactionInput,
} from './inventory.schemas.js';

/** Business rules, transactions and audit for inventory. No SQL, no HTTP. */
export class InventoryService {
  constructor(
    private readonly pool: DbPool,
    private readonly categories: InventoryCategoryRepository,
    private readonly items: InventoryRepository,
  ) {}

  // --- categories ---

  async listCategories() {
    return (await this.categories.list()).map(toCategoryResponse);
  }

  async createCategory(actor: string, req: CreateCategoryInput) {
    const c = await withTx(this.pool, async (tx) => {
      const row = await this.categories.insert(req, tx);
      await auditLog(tx, {
        userId: actor, action: 'CREATE', entityType: 'INVENTORY_ITEM', entityId: row.id, entityName: row.name,
        description: 'Created inventory category',
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
        userId: actor, action: 'UPDATE', entityType: 'INVENTORY_ITEM', entityId: row.id, entityName: row.name,
        description: 'Updated inventory category',
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
    const row = await this.items.findById(id);
    if (!row) throw notFound('ITEM_NOT_FOUND', 'Item not found.');
    return toItemResponse(row);
  }

  async listItems(q: PageQuery, f: { status?: string; categoryId?: string }) {
    const rows = await this.items.list(f, q.pageSize, pageOffset(q));
    const total = await this.items.count(f);
    return newPage(rows.map(toItemResponse), q.page, q.pageSize, total);
  }

  async createItem(actor: string, req: ItemInput) {
    const out = await withTx(this.pool, async (tx) => {
      const code = await nextCode(tx, 'inventoryItem');
      let it: ItemRow;
      try {
        it = await this.items.insert({ ...req, code, status: statusFor(req.currentStock, req.minimumStock) }, tx);
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
    return toItemResponse(out);
  }

  async updateItem(actor: string, id: string, req: ItemUpdateInput) {
    const out = await withTx(this.pool, async (tx) => {
      const it = await this.items.update(id, req, tx);
      if (!it) throw notFound('ITEM_NOT_FOUND', 'Item not found.');
      await auditLog(tx, {
        userId: actor, action: 'UPDATE', entityType: 'INVENTORY_ITEM', entityId: it.id, entityName: it.name,
        description: 'Updated item',
      });
      return it;
    });
    return toItemResponse(out);
  }

  async deleteItem(actor: string, id: string) {
    await withTx(this.pool, async (tx) => {
      try {
        await this.items.delete(id, tx);
      } catch (err) {
        if (isForeignKeyViolation(err)) throw conflict('ITEM_REFERENCED', 'This item has transactions and cannot be deleted.');
        throw err;
      }
      await auditLog(tx, { userId: actor, action: 'DELETE', entityType: 'INVENTORY_ITEM', entityId: id, description: 'Deleted item' });
    });
  }

  // --- transactions ---

  async listTransactions(itemId: string) {
    return (await this.items.listTransactions(itemId)).map(toTransactionResponse);
  }

  /** Stock update + transaction insert atomically; the row lock serialises concurrent writers. */
  async recordTransaction(actor: string, itemId: string, req: TransactionInput) {
    const out = await withTx(this.pool, async (tx) => {
      const it = await this.items.findByIdForUpdate(itemId, tx);
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
      await this.items.updateStock(itemId, newStock, statusFor(newStock, it.minimum_stock), tx);
      const txn = await this.items.insertTransaction(itemId, req, tx);
      await auditLog(tx, {
        userId: actor, action: 'CREATE', entityType: 'INVENTORY_ITEM', entityId: itemId, entityName: it.name,
        description: `Inventory ${req.type} qty=${req.quantity}`,
      });
      return txn;
    });
    return toTransactionResponse(out);
  }
}
