import { auditLog } from '../../common/audit.js';
import { nextCode } from '../../common/codegen.js';
import { badRequest, conflict, notFound } from '../../common/errors.js';
import { newPage, pageOffset, type PageQuery } from '../../common/pagination.js';
import { isForeignKeyViolation, withTx, type DbPool } from '../../db/pool.js';
import {
  toCategoryResponse, toEquipmentResponse, toMaintenanceResponse,
} from './equipment.model.js';
import type { EquipmentFilter, EquipmentRepository } from './equipment.repository.js';
import type {
  CategoryInput, CategoryUpdateInput, EquipmentInput, EquipmentUpdateInput, MaintenanceInput,
} from './equipment.schemas.js';

/** Business rules, transactions and audit. No SQL (see repository) and no HTTP (see controller). */
export class EquipmentService {
  constructor(
    private readonly pool: DbPool,
    private readonly repo: EquipmentRepository,
  ) {}

  // --- categories ---

  async listCategories() {
    return (await this.repo.listCategories()).map(toCategoryResponse);
  }

  async createCategory(actor: string, req: CategoryInput) {
    const c = await withTx(this.pool, async (tx) => {
      const row = await this.repo.insertCategory(req, tx);
      await auditLog(tx, {
        userId: actor, action: 'CREATE', entityType: 'EQUIPMENT', entityId: row.id, entityName: row.name,
        description: 'Created equipment category',
      });
      return row;
    });
    return toCategoryResponse(c);
  }

  async updateCategory(actor: string, id: string, req: CategoryUpdateInput) {
    const c = await withTx(this.pool, async (tx) => {
      const row = await this.repo.updateCategory(id, req, tx);
      if (!row) throw notFound('CATEGORY_NOT_FOUND', 'Category not found.');
      await auditLog(tx, {
        userId: actor, action: 'UPDATE', entityType: 'EQUIPMENT', entityId: row.id, entityName: row.name,
        description: 'Updated equipment category',
      });
      return row;
    });
    return toCategoryResponse(c);
  }

  async deleteCategory(actor: string, id: string) {
    await withTx(this.pool, async (tx) => {
      try {
        await this.repo.deleteCategory(id, tx);
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
    const row = await this.repo.findEquipmentById(id);
    if (!row) throw notFound('EQUIPMENT_NOT_FOUND', 'Equipment not found.');
    return toEquipmentResponse(row);
  }

  async listEquipment(q: PageQuery, f: EquipmentFilter) {
    const rows = await this.repo.listEquipment(f, q.pageSize, pageOffset(q));
    const total = await this.repo.countEquipment(f);
    return newPage(rows.map(toEquipmentResponse), q.page, q.pageSize, total);
  }

  async createEquipment(actor: string, req: EquipmentInput) {
    const created = await withTx(this.pool, async (tx) => {
      const code = await nextCode(tx, 'equipment');
      let e;
      try {
        e = await this.repo.insertEquipment(code, req, tx);
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
    return toEquipmentResponse(created);
  }

  async updateEquipment(actor: string, id: string, req: EquipmentUpdateInput) {
    const out = await withTx(this.pool, async (tx) => {
      const e = await this.repo.updateEquipment(id, req, tx);
      if (!e) throw notFound('EQUIPMENT_NOT_FOUND', 'Equipment not found.');
      await auditLog(tx, {
        userId: actor, action: 'UPDATE', entityType: 'EQUIPMENT', entityId: e.id, entityName: e.name,
        description: 'Updated equipment',
      });
      return e;
    });
    return toEquipmentResponse(out);
  }

  async deleteEquipment(actor: string, id: string) {
    await withTx(this.pool, async (tx) => {
      try {
        await this.repo.deleteEquipment(id, tx);
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
    return (await this.repo.listMaintenance(equipmentId)).map(toMaintenanceResponse);
  }

  async addMaintenance(actor: string, equipmentId: string, req: MaintenanceInput) {
    const out = await withTx(this.pool, async (tx) => {
      let m;
      try {
        m = await this.repo.insertMaintenance(equipmentId, req, tx);
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
    return toMaintenanceResponse(out);
  }
}
