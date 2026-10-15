import type { FastifyInstance } from 'fastify';
import type { EquipmentController } from './equipment.controller.js';

/** Route table: path + method + permission -> controller action. */
export function equipmentRoutes(c: EquipmentController) {
  return async (app: FastifyInstance) => {
    const perm = (p: Parameters<FastifyInstance['requirePermission']>[0]) => ({ onRequest: [app.requirePermission(p)] });

    // categories
    app.get('/equipment-categories', perm('equipment:view'), c.listCategories);
    app.post('/equipment-categories', perm('equipment:create'), c.createCategory);
    app.patch('/equipment-categories/:id', perm('equipment:edit'), c.updateCategory);
    app.delete('/equipment-categories/:id', perm('equipment:delete'), c.removeCategory);

    // equipment
    app.get('/equipment', perm('equipment:view'), c.list);
    app.get('/equipment/:id', perm('equipment:view'), c.get);
    app.post('/equipment', perm('equipment:create'), c.create);
    app.patch('/equipment/:id', perm('equipment:edit'), c.update);
    app.delete('/equipment/:id', perm('equipment:delete'), c.remove);

    // maintenance
    app.get('/equipment/:id/maintenance', perm('equipment:view'), c.listMaintenance);
    app.post('/equipment/:id/maintenance', perm('equipment:maintenance'), c.addMaintenance);
  };
}
