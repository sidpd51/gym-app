import { auditLog } from '../../common/audit.js';
import { nextCode } from '../../common/codegen.js';
import { badRequest, conflict, notFound } from '../../common/errors.js';
import { newPage, pageOffset, type PageQuery } from '../../common/pagination.js';
import { exec, isForeignKeyViolation, queryMany, queryOne, withTx, type DbPool } from '../../db/pool.js';

type Nullish<T> = { [K in keyof T]?: T[K] | null };

export interface CategoryInput { name?: string | null; description?: string | null; status?: string | null }
export interface EquipmentInput {
  name: string; categoryId: string; brand?: string | null; model?: string | null; serialNumber?: string | null;
  purchaseDate?: string | null; purchaseCost?: string | null; location?: string | null; status?: string | null; notes?: string | null;
}
export type EquipmentUpdateInput = Nullish<Pick<EquipmentInput, 'name' | 'brand' | 'model' | 'serialNumber' | 'location' | 'status' | 'notes'>>;
export interface MaintenanceInput {
  maintenanceDate: string; maintenanceType: string; description: string; cost?: string | null;
  performedBy?: string | null; nextMaintenanceDate?: string | null; notes?: string | null;
}

/** shopspring/decimal marshals as a JSON string with trailing zeros trimmed ("1500.50" -> "1500.5"). */
export function decimalOut(v: string | null): string | null {
  if (v === null || v === undefined) return null;
  return v.includes('.') ? v.replace(/0+$/, '').replace(/\.$/, '') : v;
}

const toCategory = (c: any) => ({ id: c.id, name: c.name, description: c.description, status: c.status });

const toEquipment = (e: any) => ({
  id: e.id,
  equipmentCode: e.equipment_code,
  name: e.name,
  categoryId: e.category_id,
  brand: e.brand,
  model: e.model,
  serialNumber: e.serial_number,
  purchaseDate: e.purchase_date,
  purchaseCost: decimalOut(e.purchase_cost),
  location: e.location,
  status: e.status,
  notes: e.notes,
  createdAt: e.created_at,
});

const toMaintenance = (m: any) => ({
  id: m.id,
  equipmentId: m.equipment_id,
  maintenanceDate: m.maintenance_date,
  maintenanceType: m.maintenance_type,
  description: m.description,
  cost: decimalOut(m.cost),
  performedBy: m.performed_by,
  nextMaintenanceDate: m.next_maintenance_date,
  notes: m.notes,
  createdAt: m.created_at,
});

const EQ_FILTER = `WHERE ($1::equipment_status IS NULL OR status = $1::equipment_status)
  AND ($2::uuid IS NULL OR category_id = $2::uuid)`;

export class EquipmentService {
  constructor(private readonly pool: DbPool) {}

  // --- categories ---

  async listCategories() {
    const rows = await queryMany(this.pool, 'SELECT * FROM equipment_categories ORDER BY name ASC');
    return rows.map(toCategory);
  }

  async createCategory(actor: string, req: CategoryInput) {
    const c = await withTx(this.pool, async (tx) => {
      const row = (await queryOne(
        tx,
        'INSERT INTO equipment_categories (name, description, status) VALUES ($1, $2, $3) RETURNING *',
        [req.name, req.description ?? null, req.status ?? 'ACTIVE'],
      ))!;
      await auditLog(tx, {
        userId: actor, action: 'CREATE', entityType: 'EQUIPMENT', entityId: row.id, entityName: row.name,
        description: 'Created equipment category',
      });
      return row;
    });
    return toCategory(c);
  }

  async updateCategory(actor: string, id: string, req: CategoryInput) {
    const c = await withTx(this.pool, async (tx) => {
      const row = await queryOne(
        tx,
        `UPDATE equipment_categories
         SET name = COALESCE($2, name), description = COALESCE($3, description),
             status = COALESCE($4::category_status, status)
         WHERE id = $1 RETURNING *`,
        [id, req.name || null, req.description ?? null, req.status ?? null],
      );
      if (!row) throw notFound('CATEGORY_NOT_FOUND', 'Category not found.');
      await auditLog(tx, {
        userId: actor, action: 'UPDATE', entityType: 'EQUIPMENT', entityId: row.id, entityName: row.name,
        description: 'Updated equipment category',
      });
      return row;
    });
    return toCategory(c);
  }

  async deleteCategory(actor: string, id: string) {
    await withTx(this.pool, async (tx) => {
      try {
        await exec(tx, 'DELETE FROM equipment_categories WHERE id = $1', [id]);
      } catch (err) {
        if (isForeignKeyViolation(err)) throw conflict('CATEGORY_REFERENCED', 'This category has equipment and cannot be deleted.');
        throw err;
      }
      await auditLog(tx, {
        userId: actor, action: 'DELETE', entityType: 'EQUIPMENT', entityId: id, description: 'Deleted equipment category',
      });
    });
  }

  // --- equipment ---

  async getEquipment(id: string) {
    const row = await queryOne(this.pool, 'SELECT * FROM equipment WHERE id = $1', [id]);
    if (!row) throw notFound('EQUIPMENT_NOT_FOUND', 'Equipment not found.');
    return toEquipment(row);
  }

  async listEquipment(q: PageQuery, f: { status?: string; categoryId?: string }) {
    const params = [f.status || null, f.categoryId || null];
    const rows = await queryMany(
      this.pool,
      `SELECT * FROM equipment ${EQ_FILTER} ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
      [...params, q.pageSize, pageOffset(q)],
    );
    const total = (await queryOne<{ count: number }>(this.pool, `SELECT COUNT(*) FROM equipment ${EQ_FILTER}`, params))!.count;
    return newPage(rows.map(toEquipment), q.page, q.pageSize, total);
  }

  async createEquipment(actor: string, req: EquipmentInput) {
    const created = await withTx(this.pool, async (tx) => {
      const code = await nextCode(tx, 'equipment');
      let e: any;
      try {
        e = await queryOne(
          tx,
          `INSERT INTO equipment (equipment_code, name, category_id, brand, model, serial_number,
             purchase_date, purchase_cost, location, status, notes)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
          [
            code, req.name, req.categoryId, req.brand ?? null, req.model ?? null, req.serialNumber ?? null,
            req.purchaseDate ?? null, req.purchaseCost ?? null, req.location ?? null, req.status ?? 'ACTIVE', req.notes ?? null,
          ],
        );
      } catch (err) {
        if (isForeignKeyViolation(err)) throw badRequest('INVALID_REFERENCE', 'Category not found.');
        throw err;
      }
      await auditLog(tx, {
        userId: actor, action: 'CREATE', entityType: 'EQUIPMENT', entityId: e.id, entityName: e.name,
        description: `Created equipment ${e.equipment_code}`,
      });
      return e;
    });
    return toEquipment(created);
  }

  async updateEquipment(actor: string, id: string, req: EquipmentUpdateInput) {
    const out = await withTx(this.pool, async (tx) => {
      const e = await queryOne(
        tx,
        `UPDATE equipment
         SET name = COALESCE($2, name), brand = COALESCE($3, brand), model = COALESCE($4, model),
             serial_number = COALESCE($5, serial_number), location = COALESCE($6, location),
             status = COALESCE($7::equipment_status, status), notes = COALESCE($8, notes), updated_at = NOW()
         WHERE id = $1 RETURNING *`,
        [id, req.name ?? null, req.brand ?? null, req.model ?? null, req.serialNumber ?? null,
          req.location ?? null, req.status ?? null, req.notes ?? null],
      );
      if (!e) throw notFound('EQUIPMENT_NOT_FOUND', 'Equipment not found.');
      await auditLog(tx, {
        userId: actor, action: 'UPDATE', entityType: 'EQUIPMENT', entityId: e.id, entityName: e.name,
        description: 'Updated equipment',
      });
      return e;
    });
    return toEquipment(out);
  }

  async deleteEquipment(actor: string, id: string) {
    await withTx(this.pool, async (tx) => {
      try {
        await exec(tx, 'DELETE FROM equipment WHERE id = $1', [id]);
      } catch (err) {
        if (isForeignKeyViolation(err)) {
          throw conflict('EQUIPMENT_REFERENCED', 'This equipment has maintenance records and cannot be deleted.');
        }
        throw err;
      }
      await auditLog(tx, {
        userId: actor, action: 'DELETE', entityType: 'EQUIPMENT', entityId: id, description: 'Deleted equipment',
      });
    });
  }

  // --- maintenance ---

  async listMaintenance(equipmentId: string) {
    const rows = await queryMany(
      this.pool,
      'SELECT * FROM equipment_maintenance WHERE equipment_id = $1 ORDER BY maintenance_date DESC',
      [equipmentId],
    );
    return rows.map(toMaintenance);
  }

  async addMaintenance(actor: string, equipmentId: string, req: MaintenanceInput) {
    const out = await withTx(this.pool, async (tx) => {
      let m: any;
      try {
        m = await queryOne(
          tx,
          `INSERT INTO equipment_maintenance (equipment_id, maintenance_date, maintenance_type, description,
             cost, performed_by, next_maintenance_date, notes)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
          [equipmentId, req.maintenanceDate, req.maintenanceType, req.description, req.cost ?? null,
            req.performedBy ?? null, req.nextMaintenanceDate ?? null, req.notes ?? null],
        );
      } catch (err) {
        if (isForeignKeyViolation(err)) throw badRequest('INVALID_REFERENCE', 'Equipment not found.');
        throw err;
      }
      await auditLog(tx, {
        userId: actor, action: 'CREATE', entityType: 'EQUIPMENT_MAINTENANCE', entityId: m.id,
        description: `Maintenance ${req.maintenanceType} on equipment ${equipmentId}`,
      });
      return m;
    });
    return toMaintenance(out);
  }
}
