import type { FastifyInstance } from 'fastify';
import type { InventoryController } from './inventory.controller.js';

/** Route table: path + method + permission -> controller action. */
export function inventoryRoutes(c: InventoryController) {
  return async (app: FastifyInstance) => {
    const perm = (p: Parameters<FastifyInstance['requirePermission']>[0]) => ({ onRequest: [app.requirePermission(p)] });

    app.get('/inventory-categories', perm('inventory:view'), c.listCategories);
    app.post('/inventory-categories', perm('inventory:create'), c.createCategory);
    app.patch('/inventory-categories/:id', perm('inventory:edit'), c.updateCategory);
    app.delete('/inventory-categories/:id', perm('inventory:delete'), c.removeCategory);

    app.get('/inventory', perm('inventory:view'), c.listItems);
    app.get('/inventory/:id', perm('inventory:view'), c.getItem);
    app.post('/inventory', perm('inventory:create'), c.createItem);
    app.patch('/inventory/:id', perm('inventory:edit'), c.updateItem);
    app.delete('/inventory/:id', perm('inventory:delete'), c.removeItem);

    app.get('/inventory/:id/transactions', perm('inventory:view'), c.listTransactions);
    app.post('/inventory/:id/transactions', perm('inventory:edit'), c.recordTransaction);
  };
}
