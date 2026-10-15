import { exec, queryMany, queryOne, type Db, type DbPool } from '../../db/pool.js';
import type { CategoryRow, EquipmentRow, MaintenanceRow } from './equipment.model.js';
import type {
  CategoryInput, CategoryUpdateInput, EquipmentInput, EquipmentUpdateInput, MaintenanceInput,
} from './equipment.schemas.js';

const EQ_FILTER = `WHERE ($1::equipment_status IS NULL OR status = $1::equipment_status)
  AND ($2::uuid IS NULL OR category_id = $2::uuid)`;

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
    const row = await queryOne<CategoryRow>(
      db,
      'INSERT INTO equipment_categories (name, description, status) VALUES ($1, $2, $3) RETURNING *',
      [req.name, req.description ?? null, req.status ?? 'ACTIVE'],
    );
    return row!;
  }

  /** Partial update: empty/null fields are left unchanged. Undefined result = no such category. */
  updateCategory(id: string, req: CategoryUpdateInput, db: Db = this.pool) {
    return queryOne<CategoryRow>(
      db,
      `UPDATE equipment_categories
       SET name = COALESCE($2, name), description = COALESCE($3, description),
           status = COALESCE($4::category_status, status)
       WHERE id = $1 RETURNING *`,
      [id, req.name || null, req.description ?? null, req.status ?? null],
    );
  }

  deleteCategory(id: string, db: Db = this.pool) {
    return exec(db, 'DELETE FROM equipment_categories WHERE id = $1', [id]);
  }

  // --- equipment ---

  findEquipmentById(id: string, db: Db = this.pool) {
    return queryOne<EquipmentRow>(db, 'SELECT * FROM equipment WHERE id = $1', [id]);
  }

  listEquipment(f: EquipmentFilter, limit: number, offset: number, db: Db = this.pool) {
    return queryMany<EquipmentRow>(
      db,
      `SELECT * FROM equipment ${EQ_FILTER} ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
      [f.status || null, f.categoryId || null, limit, offset],
    );
  }

  async countEquipment(f: EquipmentFilter, db: Db = this.pool): Promise<number> {
    const row = await queryOne<{ count: number }>(db, `SELECT COUNT(*) FROM equipment ${EQ_FILTER}`, [
      f.status || null,
      f.categoryId || null,
    ]);
    return row!.count;
  }

  async insertEquipment(code: string, req: EquipmentInput, db: Db = this.pool): Promise<EquipmentRow> {
    const row = await queryOne<EquipmentRow>(
      db,
      `INSERT INTO equipment (equipment_code, name, category_id, brand, model, serial_number,
         purchase_date, purchase_cost, location, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [
        code, req.name, req.categoryId, req.brand ?? null, req.model ?? null, req.serialNumber ?? null,
        req.purchaseDate ?? null, req.purchaseCost ?? null, req.location ?? null, req.status ?? 'ACTIVE', req.notes ?? null,
      ],
    );
    return row!;
  }

  updateEquipment(id: string, req: EquipmentUpdateInput, db: Db = this.pool) {
    return queryOne<EquipmentRow>(
      db,
      `UPDATE equipment
       SET name = COALESCE($2, name), brand = COALESCE($3, brand), model = COALESCE($4, model),
           serial_number = COALESCE($5, serial_number), location = COALESCE($6, location),
           status = COALESCE($7::equipment_status, status), notes = COALESCE($8, notes), updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id, req.name ?? null, req.brand ?? null, req.model ?? null, req.serialNumber ?? null,
        req.location ?? null, req.status ?? null, req.notes ?? null],
    );
  }

  deleteEquipment(id: string, db: Db = this.pool) {
    return exec(db, 'DELETE FROM equipment WHERE id = $1', [id]);
  }

  // --- maintenance ---

  listMaintenance(equipmentId: string, db: Db = this.pool) {
    return queryMany<MaintenanceRow>(
      db,
      'SELECT * FROM equipment_maintenance WHERE equipment_id = $1 ORDER BY maintenance_date DESC',
      [equipmentId],
    );
  }

  async insertMaintenance(equipmentId: string, req: MaintenanceInput, db: Db = this.pool): Promise<MaintenanceRow> {
    const row = await queryOne<MaintenanceRow>(
      db,
      `INSERT INTO equipment_maintenance (equipment_id, maintenance_date, maintenance_type, description,
         cost, performed_by, next_maintenance_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [equipmentId, req.maintenanceDate, req.maintenanceType, req.description, req.cost ?? null,
        req.performedBy ?? null, req.nextMaintenanceDate ?? null, req.notes ?? null],
    );
    return row!;
  }
}
