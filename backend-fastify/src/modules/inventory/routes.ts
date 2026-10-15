import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { badRequest } from '../../common/errors.js';
import { parsePageQuery } from '../../common/pagination.js';
import { dateString, parse, uuidParam } from '../../common/validate.js';
import { actorId } from '../../plugins/auth.js';
import type { InventoryService } from './service.js';

const status = z.enum(['ACTIVE', 'INACTIVE']);
const int = z.number().int();

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().nullish(),
  status: status.nullish(),
});
// Go does no validation on category update; empty name simply means "unchanged".
const updateCategorySchema = z.object({
  name: z.string().nullish(),
  description: z.string().nullish(),
  status: status.nullish(),
});
const createItemSchema = z.object({
  name: z.string().min(1).max(100),
  categoryId: z.uuid(),
  unit: z.string().min(1).max(20),
  currentStock: int.min(0).nullish().transform((v) => v ?? 0),
  minimumStock: int.min(0).nullish().transform((v) => v ?? 0),
  description: z.string().nullish(),
});
const updateItemSchema = z.object({
  name: z.string().min(1).max(100).nullish(),
  unit: z.string().max(20).nullish(),
  minimumStock: int.min(0).nullish(),
  description: z.string().nullish(),
});
const transactionSchema = z.object({
  type: z.enum(['STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT']),
  quantity: int.gt(0),
  transactionDate: dateString,
  reference: z.string().max(100).nullish(),
  notes: z.string().nullish(),
});

export function inventoryRoutes(svc: InventoryService) {
  return async (app: FastifyInstance) => {
    const perm = (p: Parameters<typeof app.requirePermission>[0]) => ({ onRequest: [app.requirePermission(p)] });
    const id = (req: Parameters<typeof uuidParam>[0]) => uuidParam(req, 'id', 'Invalid id.');

    app.get('/inventory-categories', perm('inventory:view'), async () => svc.listCategories());
    app.post('/inventory-categories', perm('inventory:create'), async (req, reply) =>
      reply.status(201).send(await svc.createCategory(actorId(req), parse(createCategorySchema, req.body))),
    );
    app.patch('/inventory-categories/:id', perm('inventory:edit'), async (req) =>
      svc.updateCategory(actorId(req), id(req), parse(updateCategorySchema, req.body)),
    );
    app.delete('/inventory-categories/:id', perm('inventory:delete'), async (req, reply) => {
      await svc.deleteCategory(actorId(req), id(req));
      return reply.status(204).send();
    });

    app.get('/inventory', perm('inventory:view'), async (req) => {
      const query = req.query as Record<string, string>;
      if (query.categoryId && !z.uuid().safeParse(query.categoryId).success) {
        throw badRequest('INVALID_UUID', 'Invalid categoryId.');
      }
      return svc.listItems(parsePageQuery(query), {
        status: query.status || undefined,
        categoryId: query.categoryId || undefined,
      });
    });
    app.get('/inventory/:id', perm('inventory:view'), async (req) => svc.getItem(id(req)));
    app.post('/inventory', perm('inventory:create'), async (req, reply) =>
      reply.status(201).send(await svc.createItem(actorId(req), parse(createItemSchema, req.body))),
    );
    app.patch('/inventory/:id', perm('inventory:edit'), async (req) =>
      svc.updateItem(actorId(req), id(req), parse(updateItemSchema, req.body)),
    );
    app.delete('/inventory/:id', perm('inventory:delete'), async (req, reply) => {
      await svc.deleteItem(actorId(req), id(req));
      return reply.status(204).send();
    });

    app.get('/inventory/:id/transactions', perm('inventory:view'), async (req) => svc.listTransactions(id(req)));
    app.post('/inventory/:id/transactions', perm('inventory:edit'), async (req, reply) => {
      const itemId = id(req);
      return reply.status(201).send(await svc.recordTransaction(actorId(req), itemId, parse(transactionSchema, req.body)));
    });
  };
}
