import { exec, newId, queryMany, queryOne, type Db, type DbPool } from '../../db/pool.js';
import type { CategoryRow, EquipmentRow, MaintenanceRow } from './equipment.model.js';
import type {
  CategoryInput, CategoryUpdateInput, EquipmentInput, EquipmentUpdateInput, MaintenanceInput,
} from './equipment.schemas.js';

const EQ_FILTER = `WHERE (? IS NULL OR status = ?) AND (? IS NULL OR category_id = ?)`;
const eqParams = (f: { status?: string; categoryId?: string }) => {
  const status = f.status || null;
  const categoryId = f.categoryId || null;
  return [status, status, categoryId, categoryId];
};

export interface EquipmentFilter {
  status?: string;
  categoryId?: string;
}

/**
 * Data access for equipment_categories, equipment and equipment_maintenance.
 * All SQL lives here; no business rules. Driver errors propagate to the service.
 */
export class EquipmentRepository {
  constructor(private readonly pool: DbPool) {}

  // --- categories ---

  listCategories(db: Db = this.pool) {
    return queryMany<CategoryRow>(db, 'SELECT * FROM equipment_categories ORDER BY name ASC');
  }

  async insertCategory(req: CategoryInput, db: Db = this.pool): Promise<CategoryRow> {
    const id = newId();
    await exec(
      db,
      'INSERT INTO equipment_categories (id, name, description, status) VALUES (?, ?, ?, ?)',
      [id, req.name, req.description ?? null, req.status ?? 'ACTIVE'],
    );
    return (await queryOne<CategoryRow>(db, 'SELECT * FROM equipment_categories WHERE id = ?', [id]))!;
  }

  /** Partial update: empty/null fields are left unchanged. Undefined result = no such category. */
  async updateCategory(id: string, req: CategoryUpdateInput, db: Db = this.pool) {
    const matched = await exec(
      db,
      `UPDATE equipment_categories
       SET name = COALESCE(?, name), description = COALESCE(?, description), status = COALESCE(?, status)
       WHERE id = ?`,
      [req.name || null, req.description ?? null, req.status ?? null, id],
    );
    return matched ? queryOne<CategoryRow>(db, 'SELECT * FROM equipment_categories WHERE id = ?', [id]) : undefined;
  }

  deleteCategory(id: string, db: Db = this.pool) {
    return exec(db, 'DELETE FROM equipment_categories WHERE id = ?', [id]);
  }

  // --- equipment ---

  findEquipmentById(id: string, db: Db = this.pool) {
    return queryOne<EquipmentRow>(db, 'SELECT * FROM equipment WHERE id = ?', [id]);
  }

  listEquipment(f: EquipmentFilter, limit: number, offset: number, db: Db = this.pool) {
    return queryMany<EquipmentRow>(
      db,
      `SELECT * FROM equipment ${EQ_FILTER} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...eqParams(f), limit, offset],
    );
  }

  async countEquipment(f: EquipmentFilter, db: Db = this.pool): Promise<number> {
    const row = await queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM equipment ${EQ_FILTER}`, eqParams(f));
    return row!.count;
  }

  async insertEquipment(code: string, req: EquipmentInput, db: Db = this.pool): Promise<EquipmentRow> {
    const id = newId();
    await exec(
      db,
      `INSERT INTO equipment (id, equipment_code, name, category_id, brand, model, serial_number,
         purchase_date, purchase_cost, location, status, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, code, req.name, req.categoryId, req.brand ?? null, req.model ?? null, req.serialNumber ?? null,
        req.purchaseDate ?? null, req.purchaseCost ?? null, req.location ?? null, req.status ?? 'ACTIVE', req.notes ?? null,
      ],
    );
    return (await this.findEquipmentById(id, db))!;
  }

  async updateEquipment(id: string, req: EquipmentUpdateInput, db: Db = this.pool) {
    const matched = await exec(
      db,
      `UPDATE equipment
       SET name = COALESCE(?, name), brand = COALESCE(?, brand), model = COALESCE(?, model),
           serial_number = COALESCE(?, serial_number), location = COALESCE(?, location),
           status = COALESCE(?, status), notes = COALESCE(?, notes), updated_at = NOW(3)
       WHERE id = ?`,
      [req.name ?? null, req.brand ?? null, req.model ?? null, req.serialNumber ?? null,
        req.location ?? null, req.status ?? null, req.notes ?? null, id],
    );
    return matched ? this.findEquipmentById(id, db) : undefined;
  }

  deleteEquipment(id: string, db: Db = this.pool) {
    return exec(db, 'DELETE FROM equipment WHERE id = ?', [id]);
  }

  // --- maintenance ---

  listMaintenance(equipmentId: string, db: Db = this.pool) {
    return queryMany<MaintenanceRow>(
      db,
      'SELECT * FROM equipment_maintenance WHERE equipment_id = ? ORDER BY maintenance_date DESC',
      [equipmentId],
    );
  }

  async insertMaintenance(equipmentId: string, req: MaintenanceInput, db: Db = this.pool): Promise<MaintenanceRow> {
    const id = newId();
    await exec(
      db,
      `INSERT INTO equipment_maintenance (id, equipment_id, maintenance_date, maintenance_type, description,
         cost, performed_by, next_maintenance_date, notes)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [id, equipmentId, req.maintenanceDate, req.maintenanceType, req.description, req.cost ?? null,
        req.performedBy ?? null, req.nextMaintenanceDate ?? null, req.notes ?? null],
    );
    return (await queryOne<MaintenanceRow>(db, 'SELECT * FROM equipment_maintenance WHERE id = ?', [id]))!;
  }
}
