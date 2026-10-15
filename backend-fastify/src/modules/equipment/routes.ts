import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { parsePageQuery } from '../../common/pagination.js';
import { dateString, parse, uuidParam } from '../../common/validate.js';
import { badRequest } from '../../common/errors.js';
import { actorId } from '../../plugins/auth.js';
import type { EquipmentService } from './service.js';

/** Go decimal accepts a JSON number or numeric string; normalised to a string for pg. */
const decimalInput = z
  .union([z.number().finite(), z.string().regex(/^-?\d+(\.\d+)?$/)])
  .transform((v) => String(v));

const equipmentStatus = z.enum(['ACTIVE', 'UNDER_MAINTENANCE', 'OUT_OF_SERVICE', 'RETIRED']);
const optStr = (max: number) => z.string().max(max).nullish();

export const categorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().nullish(),
  status: z.enum(['ACTIVE', 'INACTIVE']).nullish(),
});

// Go does not validate category updates (empty name = keep existing); only the enum is checked here.
export const categoryUpdateSchema = z.object({
  name: z.string().max(100).nullish(),
  description: z.string().nullish(),
  status: z.enum(['ACTIVE', 'INACTIVE']).nullish(),
});

export const equipmentSchema = z.object({
  name: z.string().min(1).max(100),
  categoryId: z.uuid(),
  brand: optStr(100),
  model: optStr(100),
  serialNumber: optStr(100),
  purchaseDate: dateString.nullish(),
  purchaseCost: decimalInput.nullish(),
  location: optStr(100),
  status: equipmentStatus.nullish(),
  notes: z.string().nullish(),
});

export const equipmentUpdateSchema = z.object({
  name: z.string().min(1).max(100).nullish(),
  brand: optStr(100),
  model: optStr(100),
  serialNumber: optStr(100),
  location: optStr(100),
  status: equipmentStatus.nullish(),
  notes: z.string().nullish(),
});

export const maintenanceSchema = z.object({
  maintenanceDate: dateString,
  maintenanceType: z.enum(['ROUTINE', 'REPAIR', 'INSPECTION', 'REPLACEMENT']),
  description: z.string().min(1),
  cost: decimalInput.nullish(),
  performedBy: optStr(100),
  nextMaintenanceDate: dateString.nullish(),
  notes: z.string().nullish(),
});

export function equipmentRoutes(svc: EquipmentService) {
  return async (app: FastifyInstance) => {
    const perm = (p: Parameters<typeof app.requirePermission>[0]) => ({ onRequest: [app.requirePermission(p)] });

    // categories
    app.get('/equipment-categories', perm('equipment:view'), async () => svc.listCategories());
    app.post('/equipment-categories', perm('equipment:create'), async (req, reply) =>
      reply.status(201).send(await svc.createCategory(actorId(req), parse(categorySchema, req.body))),
    );
    app.patch('/equipment-categories/:id', perm('equipment:edit'), async (req) => {
      const id = uuidParam(req, 'id', 'Invalid id.');
      return svc.updateCategory(actorId(req), id, parse(categoryUpdateSchema, req.body));
    });
    app.delete('/equipment-categories/:id', perm('equipment:delete'), async (req, reply) => {
      await svc.deleteCategory(actorId(req), uuidParam(req, 'id', 'Invalid id.'));
      return reply.status(204).send();
    });

    // equipment
    app.get('/equipment', perm('equipment:view'), async (req) => {
      const query = req.query as Record<string, string>;
      if (query.categoryId && !z.uuid().safeParse(query.categoryId).success) {
        throw badRequest('INVALID_UUID', 'Invalid categoryId.');
      }
      return svc.listEquipment(parsePageQuery(query), { status: query.status || undefined, categoryId: query.categoryId || undefined });
    });
    app.get('/equipment/:id', perm('equipment:view'), async (req) => svc.getEquipment(uuidParam(req, 'id', 'Invalid id.')));
    app.post('/equipment', perm('equipment:create'), async (req, reply) =>
      reply.status(201).send(await svc.createEquipment(actorId(req), parse(equipmentSchema, req.body))),
    );
    app.patch('/equipment/:id', perm('equipment:edit'), async (req) => {
      const id = uuidParam(req, 'id', 'Invalid id.');
      return svc.updateEquipment(actorId(req), id, parse(equipmentUpdateSchema, req.body));
    });
    app.delete('/equipment/:id', perm('equipment:delete'), async (req, reply) => {
      await svc.deleteEquipment(actorId(req), uuidParam(req, 'id', 'Invalid id.'));
      return reply.status(204).send();
    });

    // maintenance
    app.get('/equipment/:id/maintenance', perm('equipment:view'), async (req) =>
      svc.listMaintenance(uuidParam(req, 'id', 'Invalid id.')),
    );
    app.post('/equipment/:id/maintenance', perm('equipment:maintenance'), async (req, reply) => {
      const id = uuidParam(req, 'id', 'Invalid id.');
      return reply.status(201).send(await svc.addMaintenance(actorId(req), id, parse(maintenanceSchema, req.body)));
    });
  };
}
